import crypto from 'crypto';

export interface EncryptedPayload {
  combined: Buffer; // [12 bytes IV][16 bytes AuthTag][Ciphertext]
  ivHex: string;
  authTagHex: string;
  algorithm: 'aes-256-gcm';
}

export class Aes256GcmCipher {
  public static readonly ALGORITHM = 'aes-256-gcm';
  public static readonly IV_LENGTH = 12; // 96 bits standard for GCM
  public static readonly TAG_LENGTH = 16; // 128 bits auth tag

  /**
   * Encrypts plaintext buffer using AES-256-GCM authenticated encryption
   */
  public static encrypt(plaintext: Buffer, key: Buffer): EncryptedPayload {
    if (key.length !== 32) {
      throw new Error(`AES-256-GCM requires a 32-byte (256-bit) key, got ${key.length} bytes`);
    }

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Package as IV (12) + AuthTag (16) + Ciphertext
    const combined = Buffer.concat([iv, authTag, ciphertext]);

    return {
      combined,
      ivHex: iv.toString('hex'),
      authTagHex: authTag.toString('hex'),
      algorithm: this.ALGORITHM,
    };
  }

  /**
   * Decrypts combined AES-256-GCM payload and verifies authentication tag
   * Throws if authentication tag fails or ciphertext is modified
   */
  public static decrypt(combined: Buffer, key: Buffer): Buffer {
    if (key.length !== 32) {
      throw new Error(`AES-256-GCM requires a 32-byte key, got ${key.length} bytes`);
    }

    if (combined.length < this.IV_LENGTH + this.TAG_LENGTH) {
      throw new Error('Ciphertext payload is truncated or invalid');
    }

    const iv = combined.subarray(0, this.IV_LENGTH);
    const authTag = combined.subarray(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH);
    const ciphertext = combined.subarray(this.IV_LENGTH + this.TAG_LENGTH);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    try {
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return plaintext;
    } catch (err: any) {
      throw new Error(`Decryption failed: Integrity tag mismatch or incorrect key (${err.message})`);
    }
  }
}
