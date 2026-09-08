import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeCaseAccess, requireRole } from '../middleware/authorize.js';
import { AuditService } from '../services/auditService.js';

const router = Router();

// GET /api/cases - List cases
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const db = await getDb();

    let query = `
      SELECT c.*, d.name as department_name, d.code as department_code, u.full_name as creator_name,
             (SELECT count(*) FROM case_members cm WHERE cm.case_id = c.id) as member_count,
             (SELECT count(*) FROM documents doc WHERE doc.case_id = c.id AND doc.status != 'DELETED') as document_count,
             (SELECT count(*) FROM evidence ev WHERE ev.case_id = c.id) as evidence_count
      FROM cases c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.deleted_at IS NULL
    `;

    const params: any[] = [];

    // If Investigator: only show cases assigned to user or created by user
    if (user.role === 'INVESTIGATOR') {
      params.push(user.id);
      query += ` AND (c.id IN (SELECT case_id FROM case_members WHERE user_id = $${params.length}) OR c.created_by = $${params.length})`;
    }

    query += ` ORDER BY c.created_at DESC`;

    const cases = await db.query(query, params);
    return res.status(200).json({ cases });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve cases.' });
  }
});

// POST /api/cases - Create new case
router.post('/', authenticate, requireRole(['ADMINISTRATOR', 'INVESTIGATOR']), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { caseNumber, title, description, departmentId, sensitivityLevel } = req.body;

    if (!caseNumber || !title) {
      return res.status(400).json({ error: 'Case number and title are required.' });
    }

    const db = await getDb();
    const caseId = uuidv4();
    const deptId = departmentId || user.departmentId;
    const sensitivity = sensitivityLevel || 'CONFIDENTIAL';

    // Insert case
    await db.run(
      `INSERT INTO cases (id, case_number, title, description, department_id, sensitivity_level, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, datetime('now'), datetime('now'))`,
      [caseId, caseNumber.toUpperCase(), title, description || '', deptId, sensitivity, user.id]
    );

    // Auto-assign creator as Lead Investigator
    await db.run(
      `INSERT INTO case_members (id, case_id, user_id, role_in_case, assigned_at)
       VALUES ($1, $2, $3, 'LEAD_INVESTIGATOR', datetime('now'))`,
      [uuidv4(), caseId, user.id]
    );

    // Audit event
    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: 'CASE_CREATED',
      resourceId: caseId,
      resourceType: 'CASE',
      caseId: caseId,
      details: { caseNumber: caseNumber.toUpperCase(), title, sensitivity },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      message: `Case ${caseNumber.toUpperCase()} created successfully.`,
      caseId,
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Case creation failed: ${err.message}` });
  }
});

// GET /api/cases/:id - Comprehensive Case Details
router.get('/:id', authenticate, authorizeCaseAccess, async (req: Request, res: Response) => {
  try {
    const caseId = req.params.id;
    const db = await getDb();

    const caseRecord = await db.get<any>(
      `SELECT c.*, d.name as department_name, d.code as department_code, u.full_name as creator_name
       FROM cases c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [caseId]
    );

    if (!caseRecord) return res.status(404).json({ error: 'Case not found.' });

    // Members
    const members = await db.query(
      `SELECT cm.id, cm.role_in_case, cm.assigned_at, u.id as user_id, u.full_name, u.email, u.badge_number, u.role
       FROM case_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.case_id = $1`,
      [caseId]
    );

    // Documents
    const documents = await db.query(
      `SELECT id, title, original_filename, mime_type, file_size, sha256_hash, sensitivity_level, ai_classification, ai_confidence, is_tampered_demo, created_at
       FROM documents
       WHERE case_id = $1 AND status != 'DELETED'
       ORDER BY created_at DESC`,
      [caseId]
    );

    // Evidence
    const evidence = await db.query(
      `SELECT e.*, u.full_name as custodian_name
       FROM evidence e
       LEFT JOIN users u ON e.current_custodian_id = u.id
       WHERE e.case_id = $1
       ORDER BY e.created_at DESC`,
      [caseId]
    );

    // Audit events related to this case
    const audits = await db.query(
      `SELECT id, user_name, action, timestamp, details
       FROM audit_logs
       WHERE case_id = $1
       ORDER BY timestamp DESC
       LIMIT 20`,
      [caseId]
    );

    // Security events related to this case
    const alerts = await db.query(
      `SELECT id, alert_type, severity, description, created_at
       FROM security_alerts
       WHERE case_id = $1
       ORDER BY created_at DESC`,
      [caseId]
    );

    return res.status(200).json({
      case: caseRecord,
      members,
      documents,
      evidence,
      timeline: audits,
      securityAlerts: alerts,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve case details.' });
  }
});

// POST /api/cases/:id/assign - Assign investigator to case
router.post('/:id/assign', authenticate, requireRole(['ADMINISTRATOR']), async (req: Request, res: Response) => {
  try {
    const caseId = req.params.id;
    const { userId, roleInCase } = req.body;
    const db = await getDb();

    const targetUser = await db.get<any>(`SELECT id, full_name, email FROM users WHERE id = $1`, [userId]);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    const memberId = uuidv4();
    await db.run(
      `INSERT INTO case_members (id, case_id, user_id, role_in_case, assigned_at)
       VALUES ($1, $2, $3, $4, datetime('now'))
       ON CONFLICT(case_id, user_id) DO UPDATE SET role_in_case = excluded.role_in_case`,
      [memberId, caseId, userId, roleInCase || 'INVESTIGATOR']
    );

    await AuditService.logEvent(db, {
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'CASE_MEMBER_ASSIGNED',
      resourceId: caseId,
      resourceType: 'CASE',
      caseId: caseId,
      details: `Assigned ${targetUser.full_name} (${targetUser.email}) as ${roleInCase || 'INVESTIGATOR'}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: `Successfully assigned ${targetUser.full_name} to case.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Assignment failed.' });
  }
});

export default router;
