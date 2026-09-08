import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface SignatureMetadata {
  algorithm: 'RSA-PSS-SHA256';
  keyFingerprint: string;
  signatureHex: string;
  signedAt: string;
  signerId: string;
  signerName: string;
  certificateAuthority: string;
}

export class DigitalSignatureEngine {
  private static privateKeyPem: string;
  private static publicKeyPem: string;
  private static keyFingerprint: string;

  public static initialize(keysDir?: string): void {
    const keyPath = keysDir || path.resolve(process.cwd(), 'vault_keys');
    if (!fs.existsSync(keyPath)) {
      fs.mkdirSync(keyPath, { recursive: true });
    }

    const privFile = path.join(keyPath, 'signing_private.pem');
    const pubFile = path.join(keyPath, 'signing_public.pem');

    if (fs.existsSync(privFile) && fs.existsSync(pubFile)) {
      this.privateKeyPem = fs.readFileSync(privFile, 'utf8');
      this.publicKeyPem = fs.readFileSync(pubFile, 'utf8');
    } else {
      // Generate standard 2048-bit RSA key pair for digital signatures
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      this.privateKeyPem = privateKey;
      this.publicKeyPem = publicKey;
      fs.writeFileSync(privFile, privateKey, { mode: 0o600 });
      fs.writeFileSync(pubFile, publicKey, { mode: 0o644 });
    }

    this.keyFingerprint = crypto
      .createHash('sha256')
      .update(this.publicKeyPem)
      .digest('hex')
      .slice(0, 32);
  }

  public static getPublicKeyPem(): string {
    if (!this.publicKeyPem) this.initialize();
    return this.publicKeyPem;
  }

  public static getKeyFingerprint(): string {
    if (!this.keyFingerprint) this.initialize();
    return this.keyFingerprint;
  }

  /**
   * Signs a document's SHA-256 hash using backend asymmetric private key
   */
  public static signHash(
    documentSha256: string,
    signerId: string,
    signerName: string
  ): SignatureMetadata {
    if (!this.privateKeyPem) this.initialize();

    const sign = crypto.createSign('SHA256');
    sign.update(documentSha256);
    sign.end();

    const signature = sign.sign({
      key: this.privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    });

    return {
      algorithm: 'RSA-PSS-SHA256',
      keyFingerprint: this.keyFingerprint,
      signatureHex: signature.toString('hex'),
      signedAt: new Date().toISOString(),
      signerId,
      signerName,
      certificateAuthority: 'SecureVault Trust Services PKI - Prototype Root CA',
    };
  }

  /**
   * Cryptographically verifies signature against the document's current hash
   */
  public static verifySignature(
    currentDocumentSha256: string,
    signatureHex: string,
    originalSignedHash?: string,
    publicKeyPem?: string
  ): {
    status: 'VALID' | 'INVALID' | 'DOCUMENT_MODIFIED_AFTER_SIGNING';
    message: string;
  } {
    if (!this.publicKeyPem) this.initialize();
    const pubKey = publicKeyPem || this.publicKeyPem;

    // Check if document was modified after signing
    if (originalSignedHash && originalSignedHash.toLowerCase() !== currentDocumentSha256.toLowerCase()) {
      return {
        status: 'DOCUMENT_MODIFIED_AFTER_SIGNING',
        message: 'Document content hash differs from the hash that was originally signed.',
      };
    }

    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(currentDocumentSha256);
      verify.end();

      const isValid = verify.verify(
        {
          key: pubKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: 32,
        },
        Buffer.from(signatureHex, 'hex')
      );

      if (isValid) {
        return {
          status: 'VALID',
          message: 'Cryptographic signature verified successfully against root authority.',
        };
      } else {
        return {
          status: 'INVALID',
          message: 'Signature verification failed: Cryptographic payload does not match public key.',
        };
      }
    } catch (err: any) {
      return {
        status: 'INVALID',
        message: `Signature verification exception: ${err.message}`,
      };
    }
  }
}
