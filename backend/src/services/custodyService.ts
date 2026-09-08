import { IDatabase } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

export interface CustodyTransferInput {
  evidenceId: string;
  caseId: string;
  previousCustodian: string;
  newCustodian: string;
  action: 'COLLECTED' | 'UPLOADED' | 'ASSIGNED' | 'TRANSFERRED' | 'REVIEWED' | 'LEGAL_SUBMISSION' | 'ARCHIVED';
  reason: string;
  performedById: string;
  integrityHash: string;
  signatureStatus?: string;
}

export class CustodyService {
  /**
   * Logs a custody transfer event and updates current evidence custodian
   */
  public static async recordTransfer(db: IDatabase, input: CustodyTransferInput): Promise<any> {
    const custodyId = uuidv4();
    const timestamp = new Date().toISOString();

    await db.run(
      `INSERT INTO chain_of_custody (id, evidence_id, case_id, previous_custodian, new_custodian, action, reason, timestamp, performed_by_id, integrity_hash, signature_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        custodyId,
        input.evidenceId,
        input.caseId,
        input.previousCustodian,
        input.newCustodian,
        input.action,
        input.reason,
        timestamp,
        input.performedById,
        input.integrityHash,
        input.signatureStatus || 'VERIFIED',
      ]
    );

    // Update evidence table status and custodian if new custodian corresponds to a known user
    await db.run(
      `UPDATE evidence 
       SET status = $1, updated_at = $2 
       WHERE id = $3`,
      [input.action, timestamp, input.evidenceId]
    );

    return {
      id: custodyId,
      ...input,
      timestamp,
    };
  }

  /**
   * Retrieves full custody timeline for an evidence item
   */
  public static async getEvidenceTimeline(db: IDatabase, evidenceId: string): Promise<any[]> {
    return await db.query(
      `SELECT c.*, u.full_name as performed_by_name, u.badge_number
       FROM chain_of_custody c
       LEFT JOIN users u ON c.performed_by_id = u.id
       WHERE c.evidence_id = $1
       ORDER BY c.timestamp ASC`,
      [evidenceId]
    );
  }
}
