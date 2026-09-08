import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/db.js';
import { AuditService } from '../services/auditService.js';
import { RiskMonitoringEngine } from '../services/risk.js';

export function requireRole(roles: string | string[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied: Your account role does not have permission to access this endpoint.',
      });
    }
    next();
  };
}

export async function authorizeCaseAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const caseId = req.params.caseId || req.params.id || req.body.caseId;
    if (!caseId) return next();

    const db = await getDb();
    const caseRecord = await db.get<any>(`SELECT id, department_id, sensitivity_level FROM cases WHERE id = $1`, [caseId]);
    if (!caseRecord) {
      return res.status(404).json({ error: 'Case record not found or inaccessible.' });
    }

    // Administrators have organization-wide supervisory access
    if (user.role === 'ADMINISTRATOR') {
      return next();
    }

    // Auditors have read-only governance access to cases
    if (user.role === 'AUDITOR') {
      if (req.method === 'GET') return next();
      return res.status(403).json({ error: 'Auditors have read-only access to case files.' });
    }

    // Investigators must be assigned to the case
    const membership = await db.get<any>(
      `SELECT id FROM case_members WHERE case_id = $1 AND user_id = $2`,
      [caseId, user.id]
    );

    if (!membership) {
      // Record unauthorized attempt
      await AuditService.logEvent(db, {
        userId: user.id,
        userName: user.fullName,
        action: 'UNAUTHORIZED_CASE_ACCESS_ATTEMPT',
        resourceId: caseId,
        resourceType: 'CASE',
        caseId: caseId,
        details: `User ${user.email} attempted unauthorized access to unassigned case ${caseId}`,
      });

      await RiskMonitoringEngine.recordSecurityEvent(db, {
        eventType: 'UNAUTHORIZED_ACCESS',
        userId: user.id,
        caseId: caseId,
        description: `Unauthorized access attempt on Case ${caseId} by ${user.fullName} (${user.role})`,
        additionalReason: `Investigator is not assigned as an active member of this case.`,
      });

      return res.status(403).json({
        error: 'Access denied: You are not assigned to this investigation case.',
      });
    }

    next();
  } catch (err: any) {
    return res.status(500).json({ error: 'Authorization check failed.' });
  }
}

export function authorizeDocumentAccess(
  action: 'READ' | 'WRITE' | 'DOWNLOAD' | 'DELETE' = 'READ'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Authentication required.' });

      const docId = req.params.docId || req.params.id || req.body.documentId;
      if (!docId) return next();

      const db = await getDb();
      const doc = await db.get<any>(
        `SELECT id, case_id, department_id, owner_id, sensitivity_level, status FROM documents WHERE id = $1`,
        [docId]
      );

      if (!doc || doc.status === 'DELETED') {
        return res.status(404).json({ error: 'Document not found or inaccessible.' });
      }

      // Administrators have full governance access
      if (user.role === 'ADMINISTRATOR') {
        return next();
      }

      // Auditors have read-only access for compliance
      if (user.role === 'AUDITOR') {
        if (action === 'READ') return next();
        return res.status(403).json({ error: 'Auditors cannot modify or delete documents.' });
      }

      // Investigators:
      // 1. If owner:
      if (doc.owner_id === user.id) {
        return next();
      }

      // 2. If assigned to case:
      if (doc.case_id) {
        const caseMember = await db.get<any>(
          `SELECT id FROM case_members WHERE case_id = $1 AND user_id = $2`,
          [doc.case_id, user.id]
        );
        if (caseMember) {
          // If sensitivity is TOP_SECRET, require explicit document permission or JIT grant
          if (doc.sensitivity_level === 'TOP_SECRET') {
            const hasPerm = await db.get<any>(
              `SELECT id FROM document_permissions 
               WHERE document_id = $1 AND user_id = $2 
               AND (expires_at IS NULL OR expires_at > datetime('now'))`,
              [doc.id, user.id]
            );
            if (hasPerm) return next();
          } else {
            return next();
          }
        }
      }

      // 3. Check explicit document permission
      const explicitPerm = await db.get<any>(
        `SELECT id, permission FROM document_permissions 
         WHERE document_id = $1 AND user_id = $2 
         AND (expires_at IS NULL OR expires_at > datetime('now'))`,
        [doc.id, user.id]
      );

      if (explicitPerm) {
        if (action === 'WRITE' && explicitPerm.permission === 'READ') {
          return res.status(403).json({ error: 'Read-only permission granted on this document.' });
        }
        return next();
      }

      // 4. Check active approved temporary JIT access
      const jitAccess = await db.get<any>(
        `SELECT id FROM access_requests 
         WHERE document_id = $1 AND user_id = $2 AND status = 'APPROVED' 
         AND expires_at > datetime('now')`,
        [doc.id, user.id]
      );

      if (jitAccess) {
        return next();
      }

      // Authorization failed -> Log audit and trigger security alert
      await AuditService.logEvent(db, {
        userId: user.id,
        userName: user.fullName,
        action: 'UNAUTHORIZED_DOCUMENT_ACCESS_ATTEMPT',
        resourceId: doc.id,
        resourceType: 'DOCUMENT',
        caseId: doc.case_id,
        details: `Unauthorized attempt to ${action} document ${doc.id} by ${user.email} (${user.role})`,
      });

      await RiskMonitoringEngine.recordSecurityEvent(db, {
        eventType: 'UNAUTHORIZED_ACCESS',
        userId: user.id,
        resourceId: doc.id,
        caseId: doc.case_id,
        description: `Blocked unauthorized ${action} attempt on confidential document ${doc.id} by ${user.fullName}`,
        additionalReason: `Broken Object Level Authorization attempt: User is not assigned to Case ${doc.case_id} and possesses no explicit grant.`,
      });

      // Generic error to prevent metadata leakage
      return res.status(403).json({
        error: 'Access denied: You do not have authorization to view or access this document.',
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Authorization evaluation error.' });
    }
  };
}
