import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { AuditService } from '../services/auditService.js';
import { defaultKeyManager } from '../crypto/keyManagement.js';
import { Aes256GcmCipher } from '../crypto/cipher.js';
import { getStorageProvider } from '../storage/storageProvider.js';
import { WatermarkService } from '../services/watermark.js';

const router = Router();

// POST /api/share - Create high-entropy secure share link
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { documentId, password, canDownload, expiresInHours = 24, maxUses } = req.body;

    if (!documentId) return res.status(400).json({ error: 'Document ID is required.' });

    const db = await getDb();
    const doc = await db.get<any>(`SELECT id, title, sensitivity_level FROM documents WHERE id = $1`, [documentId]);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    // Restrict sharing of TOP_SECRET documents without Admin approval
    if (doc.sensitivity_level === 'TOP_SECRET' && user.role !== 'ADMINISTRATOR') {
      return res.status(403).json({ error: 'TOP_SECRET documents cannot be shared via external links.' });
    }

    const shareId = uuidv4();
    const token = crypto.randomBytes(24).toString('base64url'); // High-entropy 192-bit token
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

    await db.run(
      `INSERT INTO share_links (id, document_id, created_by, token, password_hash, can_download, max_uses, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, datetime('now'))`,
      [shareId, documentId, user.id, token, passwordHash, canDownload ? 1 : 0, maxUses || null, expiresAt]
    );

    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: 'SECURE_SHARE_LINK_CREATED',
      resourceId: documentId,
      resourceType: 'DOCUMENT',
      details: { tokenPreview: token.slice(0, 8) + '...', expiresInHours, canDownload: Boolean(canDownload) },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      message: 'Secure high-entropy share link generated.',
      shareUrl: `/share/${token}`,
      token,
      expiresAt,
      canDownload: Boolean(canDownload),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create share link.' });
  }
});

// GET /api/share/doc/:token - Public token document retrieval
router.get('/doc/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const password = req.headers['x-share-password'] as string;
    const db = await getDb();

    const link = await db.get<any>(
      `SELECT sl.*, d.id as doc_id, d.title, d.original_filename, d.mime_type, d.storage_path, d.sha256_hash, d.sensitivity_level
       FROM share_links sl
       JOIN documents d ON sl.document_id = d.id
       WHERE sl.token = $1`,
      [token]
    );

    if (!link) return res.status(404).json({ error: 'Secure link not found or invalid.' });

    if (link.is_revoked === 1) {
      return res.status(410).json({ error: 'This secure link has been revoked by an authorized officer.' });
    }

    if (new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This secure link has expired.' });
    }

    if (link.max_uses && link.used_count >= link.max_uses) {
      return res.status(410).json({ error: 'This one-time access link has reached maximum usage limit.' });
    }

    // Password verification
    if (link.password_hash) {
      if (!password) {
        return res.status(401).json({ passwordRequired: true, message: 'Password required to access this document.' });
      }
      const match = await bcrypt.compare(password, link.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Incorrect share access password.' });
      }
    }

    // Increment usage
    await db.run(`UPDATE share_links SET used_count = used_count + 1 WHERE id = $1`, [link.id]);

    // Decrypt and apply dynamic watermark for shared viewer
    const storage = getStorageProvider();
    const encryptedBytes = await storage.getObject(link.storage_path);
    const docKey = defaultKeyManager.getDocumentKey(link.doc_id);
    const plaintext = Aes256GcmCipher.decrypt(encryptedBytes, docKey);

    let finalBuffer = plaintext;
    if (link.mime_type === 'application/pdf') {
      finalBuffer = await WatermarkService.applyPdfWatermark(plaintext, {
        userId: 'EXTERNAL_SHARE',
        userName: `SECURE_LINK_${token.slice(0, 6)}`,
        documentId: link.doc_id,
        classification: link.sensitivity_level,
      });
    }

    // Audit view
    await AuditService.logEvent(db, {
      userId: 'ANONYMOUS_LINK',
      userName: 'External Share Consumer',
      action: 'SECURE_LINK_ACCESSED',
      resourceId: link.doc_id,
      resourceType: 'DOCUMENT',
      details: { tokenPreview: token.slice(0, 8), ip: req.ip },
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', link.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="SHARED_${link.original_filename}"`);
    return res.send(finalBuffer);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to access shared document.' });
  }
});

// POST /api/access-requests - Submit Just-in-Time Access Request
router.post('/access-requests', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { documentId, caseId, reason, durationHours = 2 } = req.body;

    if (!documentId || !reason) {
      return res.status(400).json({ error: 'Document ID and justification reason are required.' });
    }

    const db = await getDb();
    const requestId = uuidv4();

    await db.run(
      `INSERT INTO access_requests (id, document_id, user_id, case_id, reason, duration_hours, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', datetime('now'))`,
      [requestId, documentId, user.id, caseId || null, reason, durationHours]
    );

    // Notify administrators
    const admins = await db.query(`SELECT id FROM users WHERE role = 'ADMINISTRATOR'`);
    for (const a of admins) {
      await db.run(
        `INSERT INTO notifications (id, user_id, title, message, type, resource_id, created_at)
         VALUES ($1, $2, $3, $4, 'ACCESS_REQUEST', $5, datetime('now'))`,
        [uuidv4(), a.id, 'JIT Access Request', `${user.fullName} requested temporary access to Document ${documentId}.`, documentId]
      );
    }

    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: 'JIT_ACCESS_REQUESTED',
      resourceId: documentId,
      resourceType: 'DOCUMENT',
      caseId: caseId || undefined,
      details: { reason, durationHours },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      message: 'Just-in-time access request submitted for administrative review.',
      requestId,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to submit access request.' });
  }
});

// GET /api/access-requests - List Access Requests
router.get('/access-requests', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();

    let query = `
      SELECT ar.*, u.full_name as requester_name, u.email as requester_email, u.badge_number,
             d.title as document_title, d.sensitivity_level, c.case_number
      FROM access_requests ar
      JOIN users u ON ar.user_id = u.id
      JOIN documents d ON ar.document_id = d.id
      LEFT JOIN cases c ON ar.case_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (user.role !== 'ADMINISTRATOR' && user.role !== 'AUDITOR') {
      params.push(user.id);
      query += ` AND ar.user_id = $${params.length}`;
    }

    query += ` ORDER BY ar.created_at DESC`;
    const requests = await db.query(query, params);

    return res.status(200).json({ requests });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve access requests.' });
  }
});

// POST /api/access-requests/:id/approve - Approve Access Request
router.post('/access-requests/:id/approve', authenticate, requireRole(['ADMINISTRATOR']), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const requestId = req.params.id;
    const db = await getDb();

    const request = await db.get<any>(`SELECT * FROM access_requests WHERE id = $1`, [requestId]);
    if (!request) return res.status(404).json({ error: 'Access request not found.' });

    const expiresAt = new Date(Date.now() + request.duration_hours * 60 * 60 * 1000).toISOString();

    // Update request
    await db.run(
      `UPDATE access_requests SET status = 'APPROVED', reviewed_by = $1, reviewed_at = datetime('now'), expires_at = $2 WHERE id = $3`,
      [user.id, expiresAt, requestId]
    );

    // Grant temporary document permission
    await db.run(
      `INSERT INTO document_permissions (id, document_id, user_id, permission, expires_at, granted_by, created_at)
       VALUES ($1, $2, $3, 'READ', $4, $5, datetime('now'))`,
      [uuidv4(), request.document_id, request.user_id, expiresAt, user.id]
    );

    // Notify user
    await db.run(
      `INSERT INTO notifications (id, user_id, title, message, type, resource_id, created_at)
       VALUES ($1, $2, $3, $4, 'INFO', $5, datetime('now'))`,
      [uuidv4(), request.user_id, 'Access Request Approved', `Temporary access granted for ${request.duration_hours} hours.`, request.document_id]
    );

    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: 'JIT_ACCESS_APPROVED',
      resourceId: request.document_id,
      resourceType: 'DOCUMENT',
      caseId: request.case_id,
      details: { grantedTo: request.user_id, durationHours: request.duration_hours, expiresAt },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: `Access approved for ${request.duration_hours} hours. Automatically revokes at ${expiresAt}.`,
      expiresAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Approval failed.' });
  }
});

// POST /api/access-requests/:id/reject
router.post('/access-requests/:id/reject', authenticate, requireRole(['ADMINISTRATOR']), async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const db = await getDb();

    await db.run(
      `UPDATE access_requests SET status = 'REJECTED', reviewed_by = $1, reviewed_at = datetime('now') WHERE id = $2`,
      [req.user!.id, requestId]
    );

    return res.status(200).json({ message: 'Access request rejected.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Rejection failed.' });
  }
});

export default router;
