import crypto from 'crypto';
import { ENV } from '../config/env.js';

export interface IKeyManager {
  getDocumentKey(documentId: string): Buffer;
  getMasterKey(): Buffer;
  rotateKey(oldKeyId: string): Promise<string>;
}

export class LocalKeyManager implements IKeyManager {
  private masterKey: Buffer;

  constructor() {
    // Derive a strict 32-byte key from ENV.MASTER_ENCRYPTION_KEY
    if (ENV.MASTER_ENCRYPTION_KEY.length === 64 && /^[0-9a-fA-F]+$/.test(ENV.MASTER_ENCRYPTION_KEY)) {
      this.masterKey = Buffer.from(ENV.MASTER_ENCRYPTION_KEY, 'hex');
    } else {
      this.masterKey = crypto.createHash('sha256').update(ENV.MASTER_ENCRYPTION_KEY).digest();
    }
  }

  public getMasterKey(): Buffer {
    return this.masterKey;
  }

  /**
   * Derive a unique 256-bit encryption key for each document using HKDF
   * This provides envelope encryption isolation so compromising one document key does not expose others.
   */
  public getDocumentKey(documentId: string): Buffer {
    const salt = Buffer.from('SecureVault-Document-Salt-v1', 'utf8');
    const info = Buffer.from(`doc:${documentId}`, 'utf8');
    const derived = crypto.hkdfSync('sha256', this.masterKey, salt, info, 32);
    return Buffer.from(derived);
  }

  public async rotateKey(oldKeyId: string): Promise<string> {
    const newVersion = `v_${Date.now()}`;
    console.log(`[KEY MANAGEMENT] Key rotation simulated for ${oldKeyId} -> ${newVersion}`);
    return newVersion;
  }
}

/**
 * AWS KMS Key Manager placeholder interface for cloud deployment
 */
export class AwsKmsKeyManager implements IKeyManager {
  public getDocumentKey(documentId: string): Buffer {
    // In cloud production, calls AWS KMS GenerateDataKey API
    return defaultKeyManager.getDocumentKey(documentId);
  }
  public getMasterKey(): Buffer {
    return defaultKeyManager.getMasterKey();
  }
  public async rotateKey(oldKeyId: string): Promise<string> {
    return `kms_rot_${Date.now()}`;
  }
}

export const defaultKeyManager = new LocalKeyManager();
