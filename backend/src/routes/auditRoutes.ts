import { Router, Request, Response } from 'express';
import { getDb } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorize.js';
import { AuditService } from '../services/auditService.js';
import { AuditChainEngine } from '../crypto/auditChain.js';

const router = Router();

// GET /api/audit/logs - Retrieve audit logs
router.get('/logs', authenticate, async (req: Request, res: Response) => {
  try {
    const { action, caseId, limit = 50, offset = 0 } = req.query;
    const db = await getDb();

    let query = `SELECT * FROM audit_logs WHERE 1=1`;
    const params: any[] = [];

    if (action) {
      params.push(action);
      query += ` AND action = $${params.length}`;
    }

    if (caseId) {
      params.push(caseId);
      query += ` AND case_id = $${params.length}`;
    }

    query += ` ORDER BY rowid DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const logs = await db.query(query, params);
    const totalCount = await db.get<any>(`SELECT count(*) as count FROM audit_logs`);

    return res.status(200).json({
      logs,
      total: totalCount?.count || 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

// POST /api/audit/verify-chain - Cryptographic Chain Verification
router.post('/verify-chain', authenticate, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await AuditService.verifyEntireChain(db);

    return res.status(200).json({
      ...result,
      statusBadge: result.status === 'VERIFIED' ? '✅ AUDIT CHAIN VERIFIED' : '🚨 AUDIT CHAIN INTEGRITY FAILED',
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Audit chain verification error: ${err.message}` });
  }
});

// POST /api/audit/tamper-demo - Controlled Demo Tampering on Audit Log
router.post('/tamper-demo', authenticate, requireRole(['ADMINISTRATOR', 'AUDITOR']), async (req: Request, res: Response) => {
  try {
    const { logId } = req.body;
    const db = await getDb();

    let targetId = logId;
    if (!targetId) {
      // Pick second or third log if available
      const logs = await db.query<any>(`SELECT id FROM audit_logs ORDER BY rowid ASC LIMIT 5`);
      if (logs.length > 1) {
        targetId = logs[1].id;
      } else if (logs.length > 0) {
        targetId = logs[0].id;
      }
    }

    if (!targetId) {
      return res.status(400).json({ error: 'No audit records available to tamper with.' });
    }

    const success = await AuditService.simulateAuditTamper(db, targetId);
    if (!success) {
      return res.status(404).json({ error: 'Target audit record not found.' });
    }

    return res.status(200).json({
      message: `Controlled tampering applied to Audit Record ${targetId}. Run "Verify Audit Chain" to observe cryptographic failure.`,
      tamperedRecordId: targetId,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Tamper simulation failed.' });
  }
});

// POST /api/audit/repair-chain - Restore / Re-anchor Audit Chain
router.post('/repair-chain', authenticate, requireRole(['ADMINISTRATOR']), async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const logs = await db.query<any>(`SELECT * FROM audit_logs ORDER BY rowid ASC`);

    let prevHash = AuditChainEngine.GENESIS_HASH;
    for (let i = 0; i < logs.length; i++) {
      const record = logs[i];
      const recalculatedHash = AuditChainEngine.computeRecordHash({
        id: record.id,
        userId: record.user_id,
        userName: record.user_name,
        action: record.action,
        resourceId: record.resource_id,
        caseId: record.case_id,
        details: record.details,
        ipAddress: record.ip_address,
        userAgent: record.user_agent,
        timestamp: record.timestamp,
        previousHash: prevHash,
      });

      await db.run(
        `UPDATE audit_logs SET previous_hash = $1, current_hash = $2 WHERE id = $3`,
        [prevHash, recalculatedHash, record.id]
      );
      prevHash = recalculatedHash;
    }

    // Update chain state
    if (logs.length > 0) {
      await db.run(
        `UPDATE audit_chain SET last_block_id = $1, last_hash = $2, block_count = $3, updated_at = datetime('now') WHERE id = 1`,
        [logs[logs.length - 1].id, prevHash, logs.length]
      );
    }

    return res.status(200).json({
      message: 'Audit chain re-anchored and verified.',
      totalBlocks: logs.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Repair failed.' });
  }
});

export default router;
