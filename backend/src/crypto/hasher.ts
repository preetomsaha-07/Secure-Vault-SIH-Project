import crypto from 'crypto';
import fs from 'fs';

export class CryptoHasher {
  /**
   * Generates SHA-256 hash from a Buffer or string
   */
  public static sha256(data: Buffer | string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generates SHA-256 hash from a file stream
   */
  public static async hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }

  /**
   * Verifies if data matches an expected SHA-256 hash
   */
  public static verifyHash(data: Buffer | string, expectedHash: string): boolean {
    const actualHash = this.sha256(data);
    return actualHash.toLowerCase() === expectedHash.toLowerCase();
  }
}
