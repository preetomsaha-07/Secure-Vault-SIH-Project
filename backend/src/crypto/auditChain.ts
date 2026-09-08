import crypto from 'crypto';

export interface AuditRecordInput {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  resourceId?: string;
  resourceType?: string;
  caseId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string | Record<string, any>;
  previousHash: string;
}

export interface AuditRecord extends AuditRecordInput {
  currentHash: string;
}

export class AuditChainEngine {
  public static readonly GENESIS_HASH = '0'.repeat(64);

  /**
   * Computes the deterministic SHA-256 hash of an audit record linked to its predecessor
   */
  public static computeRecordHash(record: AuditRecordInput): string {
    const detailsStr =
      typeof record.details === 'object' ? JSON.stringify(record.details) : record.details || '';

    const payload = [
      record.previousHash,
      record.id,
      record.userId,
      record.action,
      record.resourceId || '',
      record.caseId || '',
      record.timestamp,
      detailsStr,
    ].join('|');

    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  /**
   * Verifies the cryptographic integrity of the entire audit chain
   */
  public static verifyChain(records: AuditRecord[]): {
    verified: boolean;
    brokenIndex?: number;
    brokenRecordId?: string;
    reason?: string;
    totalRecords: number;
    genesisVerified: boolean;
  } {
    if (!records || records.length === 0) {
      return {
        verified: true,
        totalRecords: 0,
        genesisVerified: true,
      };
    }

    // Sort records by timestamp/chain sequence if needed, but assuming sequential order
    for (let i = 0; i < records.length; i++) {
      const current = records[i];

      // Check Genesis condition on first record
      if (i === 0) {
        if (current.previousHash !== this.GENESIS_HASH) {
          return {
            verified: false,
            brokenIndex: 0,
            brokenRecordId: current.id,
            reason: `Genesis block mismatch. Expected ${this.GENESIS_HASH}, found ${current.previousHash}`,
            totalRecords: records.length,
            genesisVerified: false,
          };
        }
      } else {
        // Check link to previous record's currentHash
        const previous = records[i - 1];
        if (current.previousHash !== previous.currentHash) {
          return {
            verified: false,
            brokenIndex: i,
            brokenRecordId: current.id,
            reason: `Chain broken at record #${i} (${current.id}). Previous hash does not match hash of record #${i - 1} (${previous.id}).`,
            totalRecords: records.length,
            genesisVerified: true,
          };
        }
      }

      // Check self-consistency: recalculate expected hash
      const expectedHash = this.computeRecordHash(current);
      if (current.currentHash !== expectedHash) {
        return {
          verified: false,
          brokenIndex: i,
          brokenRecordId: current.id,
          reason: `Tampering detected at record #${i} (${current.id}). Stored hash does not match computed content hash! Stored: ${current.currentHash}, Computed: ${expectedHash}`,
          totalRecords: records.length,
          genesisVerified: true,
        };
      }
    }

    return {
      verified: true,
      totalRecords: records.length,
      genesisVerified: true,
    };
  }
}
