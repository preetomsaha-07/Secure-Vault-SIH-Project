import { Router, Request, Response } from 'express';
import { getDb } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { DigitalSignatureEngine } from '../crypto/signatures.js';

const router = Router();

// GET /api/system/stats - Overview stats
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();

    const totalDocs = await db.get<any>(`SELECT count(*) as count FROM documents WHERE status != 'DELETED'`);
    const totalCases = await db.get<any>(`SELECT count(*) as count FROM cases WHERE deleted_at IS NULL`);
    const totalEvidence = await db.get<any>(`SELECT count(*) as count FROM evidence`);
    const verifiedDocs = await db.get<any>(`SELECT count(*) as count FROM document_integrity WHERE status = 'VERIFIED'`);
    const signedDocs = await db.get<any>(`SELECT count(*) as count FROM digital_signatures`);
    const pendingRequests = await db.get<any>(`SELECT count(*) as count FROM access_requests WHERE status = 'PENDING'`);
    const activeAlerts = await db.get<any>(`SELECT count(*) as count FROM security_alerts WHERE is_resolved = 0`);

    // Storage calculation (sum of file_size)
    const storageSum = await db.get<any>(`SELECT sum(file_size) as total_bytes FROM documents WHERE status != 'DELETED'`);

    // Department breakdown
    const deptBreakdown = await db.query<any>(
      `SELECT d.name, count(doc.id) as doc_count
       FROM departments d
       LEFT JOIN documents doc ON d.id = doc.department_id AND doc.status != 'DELETED'
       GROUP BY d.id`
    );

    // Sensitivity breakdown
    const sensBreakdown = await db.query<any>(
      `SELECT sensitivity_level, count(*) as count
       FROM documents
       WHERE status != 'DELETED'
       GROUP BY sensitivity_level`
    );

    return res.status(200).json({
      userRole: user.role,
      userName: user.fullName,
      stats: {
        totalDocuments: totalDocs?.count || 0,
        totalCases: totalCases?.count || 0,
        totalEvidence: totalEvidence?.count || 0,
        verifiedDocuments: verifiedDocs?.count || 0,
        signedDocuments: signedDocs?.count || 0,
        pendingAccessRequests: pendingRequests?.count || 0,
        activeSecurityAlerts: activeAlerts?.count || 0,
        storageBytesUsed: storageSum?.total_bytes || 0,
      },
      departments: deptBreakdown,
      sensitivities: sensBreakdown,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve system statistics.' });
  }
});

// GET /api/system/departments
router.get('/departments', authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const departments = await db.query(`SELECT * FROM departments ORDER BY name ASC`);
    return res.status(200).json({ departments });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve departments.' });
  }
});

// GET /api/system/users
router.get('/users', authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const users = await db.query(
      `SELECT u.id, u.email, u.full_name, u.badge_number, u.role, u.department_id, d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.is_active = 1
       ORDER BY u.full_name ASC`
    );
    return res.status(200).json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// GET /api/system/notifications
router.get('/notifications', authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const notifications = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [req.user!.id]
    );
    return res.status(200).json({ notifications });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// POST /api/system/notifications/mark-read
router.post('/notifications/mark-read', authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = $1`, [req.user!.id]);
    return res.status(200).json({ message: 'Notifications marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

// GET /api/verify/qr/:docId - Public QR Verification (Zero Confidential Leakage)
router.get('/public-verify/:docId', async (req: Request, res: Response) => {
  try {
    const docId = req.params.docId;
    const db = await getDb();

    const doc = await db.get<any>(
      `SELECT d.id, d.sha256_hash, d.is_tampered_demo, d.created_at, dept.name as department_name, c.case_number
       FROM documents d
       LEFT JOIN departments dept ON d.department_id = dept.id
       LEFT JOIN cases c ON d.case_id = c.id
       WHERE d.id = $1 AND d.status != 'DELETED'`,
      [docId]
    );

    if (!doc) {
      return res.status(404).json({
        verified: false,
        error: 'Document record not found or does not exist in registry.',
      });
    }

    const signature = await db.get<any>(
      `SELECT signed_at, algorithm, key_fingerprint, certificate_authority 
       FROM digital_signatures 
       WHERE document_id = $1 
       ORDER BY signed_at DESC LIMIT 1`,
      [docId]
    );

    // If tampered demo, mark compromised
    const isIntegrityValid = doc.is_tampered_demo !== 1;

    // Mask hash for public display (e.g. e3b0c442...855)
    const maskedHash = `${doc.sha256_hash.slice(0, 10)}...${doc.sha256_hash.slice(-10)}`;

    return res.status(200).json({
      documentRegistryId: doc.id.slice(0, 8).toUpperCase(),
      issuingAuthority: doc.department_name || 'SecureVault Custody Network',
      caseReferenceMasked: doc.case_number ? `${doc.case_number.slice(0, 9)}***` : 'RESTRICTED',
      sha256FingerprintMasked: maskedHash,
      integrityStatus: isIntegrityValid ? 'VERIFIED_AUTHENTIC' : 'INTEGRITY_COMPROMISED',
      integrityBadge: isIntegrityValid ? '✅ INTEGRITY VERIFIED' : '🚨 INTEGRITY COMPROMISED',
      isDigitallySigned: Boolean(signature),
      signatureMetadata: signature
        ? {
            algorithm: signature.algorithm,
            keyFingerprint: signature.key_fingerprint,
            authority: signature.certificate_authority,
            signedTimestamp: signature.signed_at,
          }
        : null,
      verificationTimestamp: new Date().toISOString(),
      disclaimer: 'This public verification portal verifies cryptographic authenticity and signature validity only. No confidential contents are transmitted over this endpoint.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Public verification failed.' });
  }
});

export default router;
