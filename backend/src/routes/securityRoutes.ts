import { Router, Request, Response } from 'express';
import { getDb } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { RiskMonitoringEngine } from '../services/risk.js';
import { AuditService } from '../services/auditService.js';

const router = Router();

// GET /api/security/alerts - List security alerts
router.get('/alerts', authenticate, async (req: Request, res: Response) => {
  try {
    const { severity, isResolved } = req.query;
    const db = await getDb();

    let sql = `
      SELECT sa.*, u.full_name as user_name, u.email as user_email, c.case_number
      FROM security_alerts sa
      LEFT JOIN users u ON sa.user_id = u.id
      LEFT JOIN cases c ON sa.case_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (severity) {
      params.push(severity);
      sql += ` AND sa.severity = $${params.length}`;
    }

    if (isResolved !== undefined) {
      params.push(isResolved === 'true' ? 1 : 0);
      sql += ` AND sa.is_resolved = $${params.length}`;
    }

    sql += ` ORDER BY sa.created_at DESC LIMIT 100`;

    const alerts = await db.query<any>(sql, params);

    const formattedAlerts = alerts.map((a) => ({
      ...a,
      reasons: a.reasons ? JSON.parse(a.reasons) : [],
    }));

    return res.status(200).json({ alerts: formattedAlerts });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve security alerts.' });
  }
});

// GET /api/security/metrics - High-level security posture
router.get('/metrics', authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const riskData = await RiskMonitoringEngine.getSystemRiskMetrics(db);

    const totalDocs = await db.get<any>(`SELECT count(*) as count FROM documents WHERE status != 'DELETED'`);
    const totalCases = await db.get<any>(`SELECT count(*) as count FROM cases WHERE deleted_at IS NULL`);
    const totalEvidence = await db.get<any>(`SELECT count(*) as count FROM evidence`);
    const verifiedDocs = await db.get<any>(`SELECT count(*) as count FROM document_integrity WHERE status = 'VERIFIED'`);
    const signedDocs = await db.get<any>(`SELECT count(*) as count FROM digital_signatures`);

    const failedLogins = await db.get<any>(
      `SELECT count(*) as count FROM audit_logs WHERE action LIKE 'FAILED_LOGIN%'`
    );

    return res.status(200).json({
      riskPosture: riskData,
      totalDocuments: totalDocs?.count || 0,
      totalCases: totalCases?.count || 0,
      totalEvidence: totalEvidence?.count || 0,
      verifiedDocumentsCount: verifiedDocs?.count || 0,
      digitallySignedCount: signedDocs?.count || 0,
      failedLoginsCount: failedLogins?.count || 0,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve security metrics.' });
  }
});

// POST /api/security/alerts/:id/resolve
router.post('/alerts/:id/resolve', authenticate, requireRole(['ADMINISTRATOR', 'AUDITOR']), async (req: Request, res: Response) => {
  try {
    const alertId = req.params.id;
    const db = await getDb();

    await db.run(
      `UPDATE security_alerts 
       SET is_resolved = 1, resolved_by = $1, resolved_at = datetime('now')
       WHERE id = $2`,
      [req.user!.fullName, alertId]
    );

    await AuditService.logEvent(db, {
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'SECURITY_ALERT_RESOLVED',
      resourceId: alertId,
      resourceType: 'SECURITY_ALERT',
      details: `Alert ${alertId} resolved by ${req.user!.fullName}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({ message: 'Security incident marked as resolved.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to resolve alert.' });
  }
});

export default router;
