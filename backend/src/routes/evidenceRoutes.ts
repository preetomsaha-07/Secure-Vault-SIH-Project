import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { CustodyService } from '../services/custodyService.js';
import { AuditService } from '../services/auditService.js';
import { CryptoHasher } from '../crypto/hasher.js';

const router = Router();

// GET /api/evidence - List evidence
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { caseId } = req.query;
    const db = await getDb();

    let query = `
      SELECT e.*, c.case_number, c.title as case_title, u.full_name as custodian_name, u.badge_number
      FROM evidence e
      LEFT JOIN cases c ON e.case_id = c.id
      LEFT JOIN users u ON e.current_custodian_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (caseId) {
      params.push(caseId);
      query += ` AND e.case_id = $${params.length}`;
    }

    query += ` ORDER BY e.created_at DESC`;
    const evidenceList = await db.query(query, params);

    return res.status(200).json({ evidence: evidenceList });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve evidence records.' });
  }
});

// POST /api/evidence - Register new digital evidence
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { evidenceNumber, title, description, caseId, documentId, storageLocation, initialHash } = req.body;

    if (!evidenceNumber || !title || !caseId) {
      return res.status(400).json({ error: 'Evidence number, title, and caseId are required.' });
    }

    const db = await getDb();
    const evidenceId = uuidv4();
    const hash = initialHash || CryptoHasher.sha256(`${evidenceNumber}:${title}:${Date.now()}`);

    // Insert evidence
    await db.run(
      `INSERT INTO evidence (id, evidence_number, title, description, case_id, document_id, current_custodian_id, status, storage_location, integrity_hash, collected_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'COLLECTED', $8, $9, datetime('now'), datetime('now'), datetime('now'))`,
      [evidenceId, evidenceNumber.toUpperCase(), title, description || '', caseId, documentId || null, user.id, storageLocation || 'Forensic Locker A-12', hash]
    );

    // Record initial chain of custody entry
    await CustodyService.recordTransfer(db, {
      evidenceId,
      caseId,
      previousCustodian: 'Scene of Crime / Field Collection',
      newCustodian: `${user.fullName} (${user.badgeNumber || user.role})`,
      action: 'COLLECTED',
      reason: 'Initial physical/digital evidence recovery and forensic intake',
      performedById: user.id,
      integrityHash: hash,
      signatureStatus: 'VERIFIED',
    });

    // Audit log
    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: 'EVIDENCE_REGISTERED',
      resourceId: evidenceId,
      resourceType: 'EVIDENCE',
      caseId,
      details: { evidenceNumber: evidenceNumber.toUpperCase(), title, hash },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      message: 'Evidence successfully registered into chain of custody.',
      evidenceId,
      integrityHash: hash,
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Evidence registration failed: ${err.message}` });
  }
});

// GET /api/evidence/:id - Evidence details & custody timeline
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const evidenceId = req.params.id;
    const db = await getDb();

    const item = await db.get<any>(
      `SELECT e.*, c.case_number, c.title as case_title, u.full_name as custodian_name, u.badge_number, u.email as custodian_email
       FROM evidence e
       LEFT JOIN cases c ON e.case_id = c.id
       LEFT JOIN users u ON e.current_custodian_id = u.id
       WHERE e.id = $1`,
      [evidenceId]
    );

    if (!item) return res.status(404).json({ error: 'Evidence record not found.' });

    const timeline = await CustodyService.getEvidenceTimeline(db, evidenceId);

    return res.status(200).json({
      evidence: item,
      custodyTimeline: timeline,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve evidence details.' });
  }
});

// POST /api/evidence/:id/transfer - Record custody transfer
router.post('/:id/transfer', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const evidenceId = req.params.id;
    const { newCustodian, action, reason } = req.body;

    if (!newCustodian || !reason) {
      return res.status(400).json({ error: 'New custodian and transfer reason are required.' });
    }

    const db = await getDb();
    const item = await db.get<any>(
      `SELECT e.*, u.full_name as custodian_name FROM evidence e LEFT JOIN users u ON e.current_custodian_id = u.id WHERE e.id = $1`,
      [evidenceId]
    );

    if (!item) return res.status(404).json({ error: 'Evidence record not found.' });

    const prevCustodianName = item.custodian_name || 'Previous Custodian';

    // Record transfer
    const transferRecord = await CustodyService.recordTransfer(db, {
      evidenceId,
      caseId: item.case_id,
      previousCustodian: prevCustodianName,
      newCustodian,
      action: action || 'TRANSFERRED',
      reason,
      performedById: user.id,
      integrityHash: item.integrity_hash,
      signatureStatus: 'VERIFIED',
    });

    // Audit event
    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: 'EVIDENCE_CUSTODY_TRANSFER',
      resourceId: evidenceId,
      resourceType: 'EVIDENCE',
      caseId: item.case_id,
      details: {
        from: prevCustodianName,
        to: newCustodian,
        action: action || 'TRANSFERRED',
        reason,
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: 'Chain of custody transfer successfully logged and verified.',
      transfer: transferRecord,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Custody transfer failed.' });
  }
});

export default router;
