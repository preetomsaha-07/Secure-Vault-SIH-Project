# SECUREVAULT REST API Reference

All protected API endpoints require an active session via HTTP-Only cookie `auth_token` or `Authorization: Bearer <token>` header.

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates user and returns JWT token & user profile. Sets `auth_token` HTTP-only cookie.
- **Body**: `{ "email": "inv.a@securevault.local", "password": "Password123!" }`
- **Response**: `200 OK`
  ```json
  {
    "token": "eyJhbGci...",
    "user": {
      "id": "user_inv_a",
      "email": "inv.a@securevault.local",
      "fullName": "Senior Investigator Sharma",
      "role": "INVESTIGATOR",
      "badgeNumber": "SV-INV-104",
      "departmentName": "Investigation Division"
    }
  }
  ```

### `POST /api/auth/logout`
Terminates active session and clears authentication cookies.

### `GET /api/auth/me`
Retrieves current authenticated profile and clearance attributes.

### `POST /api/auth/step-up`
Step-up re-authentication for high-sensitivity operations (e.g. permanent deletion, cryptographic re-signing).

---

## 2. Document Management Endpoints

### `POST /api/docs/upload`
Uploads a document through the complete 8-stage cryptographic pipeline:
- **Headers**: `Content-Type: multipart/form-data`
- **Body**: `file`, `title`, `caseId`, `departmentId`, `sensitivityLevel`
- **Response**: `201 Created`
  ```json
  {
    "document": {
      "id": "uuid",
      "title": "Investigation Report 104",
      "sha256Hash": "4f8b...",
      "encryptionAlgorithm": "AES-256-GCM",
      "aiClassification": "Investigation Report",
      "aiConfidence": 0.98,
      "suggestedTags": ["Investigation", "Evidence", "Case-104"]
    }
  }
  ```

### `GET /api/docs`
Lists authorized documents based on requester's role, case memberships, and clearance.
- **Query Params**: `caseId`, `departmentId`, `sensitivity`, `search`

### `GET /api/docs/:id`
Retrieves comprehensive metadata, tags, and forensic entities.

### `GET /api/docs/:id/preview`
Decrypts ciphertext using AES-256-GCM, applies dynamic security watermark, and streams preview.

### `GET /api/docs/:id/download`
Decrypts, watermarks, streams binary attachment, and logs download event.

### `POST /api/docs/:id/verify-integrity`
Decrypts ciphertext, re-calculates SHA-256 fingerprint, and validates against registered fingerprint.
- **Response**:
  ```json
  {
    "status": "VERIFIED",
    "verified": true,
    "registeredHash": "4f8b...",
    "currentHash": "4f8b...",
    "message": "✅ INTEGRITY VERIFIED: Original registered SHA-256 fingerprint matches stored ciphertext exactly."
  }
  ```

### `POST /api/docs/:id/tamper-demo`
Simulates controlled byte modification on a demo copy to demonstrate tampering detection.

### `POST /api/docs/:id/sign`
Generates an asymmetric RSA-PSS digital signature over the document's SHA-256 hash.

### `GET /api/docs/:id/signature`
Verifies RSA-PSS digital signature against PKI root authority.

---

## 3. Case Management Endpoints

### `GET /api/cases`
Lists investigation cases accessible to the authenticated officer.

### `POST /api/cases`
Initializes a new investigation case. (Administrator or Lead Investigator)

### `GET /api/cases/:id`
Retrieves case dossier, assigned personnel, attached evidence, documents, and chronological timeline.

### `POST /api/cases/:id/assign`
Assigns an investigator to a case docket. (Administrator only)

---

## 4. Audit & Ledger Endpoints

### `GET /api/audit/logs`
Returns paginated audit trail records with previous and current block hashes.

### `POST /api/audit/verify-chain`
Iterates from Genesis anchor ($0^{64}$) through all blocks, recalculating expected hashes.
- **Response**:
  ```json
  {
    "status": "VERIFIED",
    "statusBadge": "✅ AUDIT CHAIN VERIFIED",
    "totalBlocks": 18,
    "message": "All audit blocks cryptographically verified from Genesis to latest block."
  }
  ```

### `POST /api/audit/tamper-demo`
Controlled demonstration tampering on an audit block record to test chain failure detection.

---

## 5. Digital Evidence & Custody Endpoints

### `GET /api/evidence`
Lists registered physical and electronic evidence items.

### `POST /api/evidence`
Intakes new evidence with initial hash and chain of custody genesis.

### `GET /api/evidence/:id`
Returns evidence item details and full chain of custody timeline.

### `POST /api/evidence/:id/transfer`
Logs a verifiable custody transfer (e.g. Field Seizure $\to$ Forensics Lab $\to$ Legal Review).

---

## 6. Smart Search & Investigation Graph

### `GET /api/search`
Searches metadata, full-text OCR, and parses natural language queries.
- **Example**: `/api/search?q=Find investigation documents related to vehicle evidence in Case 104`

### `GET /api/graph/investigation/:caseId?`
Returns graph nodes (Case, Person, Vehicle, Location, Evidence, Document) and edges with clearance filtering.

---

## 7. Security Incident Monitoring

### `GET /api/security/alerts`
Lists active security alerts, BOLA/IDOR attempt logs, and account lockout warnings.

### `GET /api/security/metrics`
Returns system threat posture gauge, risk scores (0-100), and breakdown counts.

### `POST /api/security/alerts/:id/resolve`
Marks an incident as reviewed and resolved by an authorized officer.

---

## 8. Public Verification

### `GET /api/system/public-verify/:docId`
Zero-leakage public verification endpoint. Returns integrity validity and digital signature attestation without transmitting confidential document text.
