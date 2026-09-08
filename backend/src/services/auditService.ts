import { IDatabase } from '../db/db.js';
import { AuditChainEngine, AuditRecord } from '../crypto/auditChain.js';
import { v4 as uuidv4 } from 'uuid';

export class AuditService {
  /**
   * Appends an event to the tamper-evident hash-chained audit log
   */
  public static async logEvent(
    db: IDatabase,
    params: {
      userId: string;
      userName?: string;
      action: string;
      resourceId?: string;
      resourceType?: string;
      caseId?: string;
      details?: string | Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<AuditRecord> {
    // 1. Fetch latest block from audit_chain table or last record in audit_logs
    const chainState = await db.get<{ last_hash: string; block_count: number }>(
      `SELECT last_hash, block_count FROM audit_chain WHERE id = 1`
    );

    let previousHash = AuditChainEngine.GENESIS_HASH;
    let blockCount = 0;

    if (chainState && chainState.last_hash) {
      previousHash = chainState.last_hash;
      blockCount = chainState.block_count;
    } else {
      // Check if any existing record exists in audit_logs
      const lastLog = await db.get<{ current_hash: string }>(
        `SELECT current_hash FROM audit_logs ORDER BY rowid DESC LIMIT 1`
      );
      if (lastLog && lastLog.current_hash) {
        previousHash = lastLog.current_hash;
      }
    }

    const eventId = uuidv4();
    const timestamp = new Date().toISOString();
    const detailsStr = typeof params.details === 'object' ? JSON.stringify(params.details) : params.details || '';

    const recordInput = {
      id: eventId,
      userId: params.userId,
      userName: params.userName || 'System',
      action: params.action,
      resourceId: params.resourceId,
      resourceType: params.resourceType,
      caseId: params.caseId,
      details: detailsStr,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'SecureVault-Agent/1.0',
      timestamp,
      previousHash,
    };

    const currentHash = AuditChainEngine.computeRecordHash(recordInput);

    // Insert into audit_logs
    await db.run(
      `INSERT INTO audit_logs (id, user_id, user_name, action, resource_id, resource_type, case_id, details, ip_address, user_agent, timestamp, previous_hash, current_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        eventId,
        params.userId,
        params.userName || 'System',
        params.action,
        params.resourceId || null,
        params.resourceType || null,
        params.caseId || null,
        detailsStr,
        recordInput.ipAddress,
        recordInput.userAgent,
        timestamp,
        previousHash,
        currentHash,
      ]
    );

    // Upsert audit_chain state
    blockCount += 1;
    await db.run(
      `INSERT INTO audit_chain (id, last_block_id, last_hash, block_count, updated_at)
       VALUES (1, $1, $2, $3, $4)
       ON CONFLICT(id) DO UPDATE SET
         last_block_id = excluded.last_block_id,
         last_hash = excluded.last_hash,
         block_count = excluded.block_count,
         updated_at = excluded.updated_at`,
      [eventId, currentHash, blockCount, timestamp]
    );

    return {
      ...recordInput,
      currentHash,
    };
  }

  /**
   * Retrieves and cryptographically validates the entire audit chain
   */
  public static async verifyEntireChain(db: IDatabase): Promise<{
    status: 'VERIFIED' | 'COMPROMISED';
    message: string;
    totalBlocks: number;
    brokenBlockIndex?: number;
    brokenBlockId?: string;
    verifiedAt: string;
  }> {
    const logs = await db.query<any>(`SELECT * FROM audit_logs ORDER BY rowid ASC`);

    const records: AuditRecord[] = logs.map((l) => ({
      id: l.id,
      userId: l.user_id,
      userName: l.user_name,
      action: l.action,
      resourceId: l.resource_id,
      resourceType: l.resource_type,
      caseId: l.case_id,
      details: l.details,
      ipAddress: l.ip_address,
      userAgent: l.user_agent,
      timestamp: l.timestamp,
      previousHash: l.previous_hash,
      currentHash: l.current_hash,
    }));

    const result = AuditChainEngine.verifyChain(records);

    if (result.verified) {
      return {
        status: 'VERIFIED',
        message: 'All audit blocks cryptographically verified from Genesis to latest block. Chain integrity intact.',
        totalBlocks: result.totalRecords,
        verifiedAt: new Date().toISOString(),
      };
    } else {
      return {
        status: 'COMPROMISED',
        message: `AUDIT CHAIN INTEGRITY FAILED: ${result.reason}`,
        totalBlocks: result.totalRecords,
        brokenBlockIndex: result.brokenIndex,
        brokenBlockId: result.brokenRecordId,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Demo utility: Simulates tampering on a specific audit log record
   */
  public static async simulateAuditTamper(db: IDatabase, logId: string): Promise<boolean> {
    const record = await db.get(`SELECT id, details FROM audit_logs WHERE id = $1`, [logId]);
    if (!record) return false;

    const tamperedDetails = `[TAMPERED RECORD] Unauthorized modification occurred. Original: ${record.details}`;
    await db.run(`UPDATE audit_logs SET details = $1 WHERE id = $2`, [tamperedDetails, logId]);
    return true;
  }
}
