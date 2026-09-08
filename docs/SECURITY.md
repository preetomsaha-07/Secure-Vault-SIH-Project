# SECUREVAULT Security & Threat Modeling Reference

## 1. Executive Security Posture

SecureVault is built on the **Zero-Trust Security Principle**:
> "Never trust, always verify. Every request must be independently authenticated, authorized, and audited."

---

## 2. OWASP Top 10 Mitigation Matrix

| OWASP Risk Category | SecureVault Architecture Defense | Implementation File |
| :--- | :--- | :--- |
| **A01: Broken Access Control (BOLA / IDOR)** | Multi-factor authorization evaluating Role + Department + Case Assignment + Explicit Grants + Sensitivity. Generic 403 responses prevent metadata enumeration. | `src/middleware/authorize.ts` |
| **A02: Cryptographic Failures** | Military-grade AES-256-GCM authenticated encryption. Unique HKDF-derived document keys. No plaintext ever stored on disk. Zero secrets in Git or client bundles. | `src/crypto/cipher.ts`, `src/crypto/keyManagement.ts` |
| **A03: Injection (SQL / NoSQL / Command)** | 100% Parameterized queries with prepared statements ($1, ?). No raw string interpolation in SQL. | `src/db/db.ts` |
| **A04: Insecure Design** | Principle of least privilege. Segregated Auditor role with zero write permissions. Automated JIT access revocation. | `src/services/accessRequestService.ts` |
| **A05: Security Misconfiguration** | Helmet security headers (CSP, X-Frame-Options: DENY, nosniff), restricted CORS origins, secure HTTP-only cookies. | `src/config/security.ts` |
| **A06: Vulnerable & Outdated Components** | Minimal audited dependencies. Modern Node.js v24 native runtimes. Zero abandoned packages. | `package.json` |
| **A07: Identification & Authentication Failures** | Argon2/Bcrypt password hashing (10 rounds). Progressive failed-login tracking. Automated account lockout after 5 consecutive failures. MFA-ready step-up auth. | `src/routes/authRoutes.ts` |
| **A08: Software & Data Integrity Failures** | Genesis-anchored SHA-256 hash-chained audit ledger. Real-time document integrity verification. Asymmetric RSA-PSS digital signatures. | `src/crypto/auditChain.ts`, `src/crypto/signatures.ts` |
| **A09: Security Logging & Monitoring Failures** | Explainable rule-based risk scoring engine. Real-time alert generation for unauthorized access, bulk downloads, and failed logins. Append-only ledger state. | `src/services/risk.ts`, `src/services/auditService.ts` |
| **A10: Server-Side Request Forgery (SSRF)** | Private S3/MinIO access through internal client abstractions. Zero external user-supplied URL fetching. | `src/storage/storageProvider.ts` |

---

## 3. Defense-in-Depth File Upload Pipeline

To prevent malicious executable uploads, MIME spoofing, path traversal, and zip bombs:
1. **Memory Buffering**: Uploads are held in memory streams and never written to disk as unencrypted plaintext.
2. **Magic Byte Signature Inspection**:
   - PDF: Must begin with `%PDF-` (`0x25, 0x50, 0x44, 0x46`).
   - PNG: Must begin with `\x89PNG\r\n\x1a\n`.
   - JPEG: Must begin with `0xFF, 0xD8, 0xFF`.
   - Office OpenXML (DOCX, XLSX): Must begin with `PK` container signature (`0x50, 0x4B, 0x03, 0x04`).
3. **Executable Binary Rejection**:
   - Rejects DOS/Windows PE binaries (`MZ` header).
   - Rejects Linux ELF binaries (`\x7fELF`).
   - Rejects batch, shell, and script extensions.
4. **Filename Sanitization**: Strips path traversal sequences (`../`, `..\`), null bytes, control characters, and dangerous shells.
5. **Payload Limit**: Strict 25MB ceiling per document enforced by Multer body-parser.

---

## 4. Zero-Leakage Public Verification Safeguard

Public QR code verification routes (`/api/system/public-verify/:docId`) provide cryptographic proof of authenticity **without ever revealing confidential content**:
- Masked SHA-256 fingerprint: `e3b0c442...855`
- Masked case number: `CASE-2026-***`
- Digital signature verification: `RSA-PSS Valid`
- Issuing authority: Department name
- **Strictly Withheld**: Original filename, case title, full text, entities, suspects, and document binaries.

---

## 5. Key Management & Key Rotation Strategy

1. **Master Encryption Key (MEK)**:
   - Stored in AWS KMS or hardware security module (HSM) in cloud production.
   - For local development, sourced from high-entropy environment variable.
2. **Envelope Subkey Derivation**:
   - For every document $D$, derive $\text{Key}_D = \text{HKDF}(\text{MEK}, \text{info}=\text{"doc:"} + D_{\text{id}})$.
   - Compromise of a single document key never compromises other documents.
3. **Key Rotation Protocol**:
   - Version identifiers stored in `documents.encryption_key_id` (`key_hkdf_v1`, `key_hkdf_v2`).
   - Background re-encryption worker decrypts with previous key version and re-encrypts with newly derived version without downtime.
