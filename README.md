# 🔐 SECUREVAULT

### Secure Digital Document & Investigation Evidence Management Platform
> *"Secure. Verify. Investigate."*

**SecureVault transforms sensitive document management into a secure, verifiable, and intelligent digital evidence ecosystem by combining AES-256-GCM encryption, case-aware access control, tamper-evident auditing, digital signatures, chain of custody, and AI-powered document intelligence.**

---

## 🌟 The 5 Pillars of SecureVault

1. **SECURE**: Real AES-256-GCM envelope encryption with per-document HKDF key derivation, multi-layered ABAC clearance (Role + Department + Case + Sensitivity), and dynamic non-destructive watermarking.
2. **TRUSTED**: Cryptographic SHA-256 fingerprinting, Genesis-anchored tamper-evident hash-chained audit ledger, and RSA-PSS asymmetric digital signatures.
3. **ACCOUNTABLE**: Indelible event logging, just-in-time (JIT) temporary access with automated expiration, and explainable rule-based risk monitoring.
4. **TRACEABILITY**: Comprehensive physical and digital evidence chain of custody timeline tracking handovers from crime scene to court submission.
5. **INTELLIGENT**: Privacy-preserving local OCR (Tesseract), AI document categorization, sensitive entity detection (PII, vehicle plates, legal sections), natural language smart search, and an interactive investigation relationship graph.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v20+ (Node v24 recommended)
- npm v10+

### Instant Local Run (Zero External Prerequisites)

```bash
# 1. Clone & Enter Directory
git clone https://github.com/securevault/securevault.git
cd securevault

# 2. Setup Environment
cp .env.example .env

# 3. Start Backend Server
cd backend
npm install
npm run seed      # Seeds fictional demo data & encrypted test documents
npm run dev       # API running at http://localhost:5000

# 4. Start Frontend Web UI (in another terminal)
cd ../frontend
npm install
npm run dev       # Web UI running at http://localhost:3000
```

### Docker Compose Deployment
```bash
docker-compose up --build -d
```

---

## 👥 Demo Personas & Credentials

All demo users share password: `Password123!` (also switchable via 1-click in the UI):

| Persona | Email | Role | Department | Demonstration Mandate |
| :--- | :--- | :--- | :--- | :--- |
| **Arthur Pendelton** | `admin@securevault.local` | `ADMINISTRATOR` | Investigation Division | System governance, case creation, investigator assignment |
| **Sharma** | `inv.a@securevault.local` | `INVESTIGATOR` | Investigation Division | Lead Investigator on **CASE-2026-104** |
| **Marcus Vance** | `inv.b@securevault.local` | `INVESTIGATOR` | Cyber Crime Division | Assigned to Case 102; **Unauthorized on Case 104 (Demonstrates 403)** |
| **Elena Rostova** | `auditor@securevault.local` | `AUDITOR` | Legal Affairs | Read-only auditor; verifies hash chain and document integrity |

---

## 🧪 Critical Security Acceptance Tests

Run the automated security acceptance test suite:
```bash
cd backend
npm test
```

### Verified Acceptance Tests:
- [x] **Test 1**: Investigator A cannot access Case B (403 Forbidden).
- [x] **Test 2**: Investigator B cannot access Investigator A's confidential document without permission (403 Forbidden).
- [x] **Test 2b**: Unauthorized access attempt recorded in tamper-evident audit ledger.
- [x] **Test 3**: Auditor cannot modify or delete audit logs.
- [x] **Test 4**: Frontend/client cannot bypass backend authorization.
- [x] **Test 5**: Expired share links cannot access documents (410 Gone).
- [x] **Test 6**: Revoked shares cannot access documents (410 Gone).
- [x] **Test 7**: Modified document fails SHA-256 integrity verification (`🚨 DOCUMENT INTEGRITY COMPROMISED`).
- [x] **Test 8**: Modified audit event causes hash-chain verification failure (`🚨 AUDIT CHAIN INTEGRITY FAILED`).
- [x] **Test 9**: Invalid digital signature fails verification (`❌ SIGNATURE INVALID`).
- [x] **Test 10 & 11**: Zero encryption keys or cloud credentials exposed in API or client bundles.
- [x] **Test 12**: AES-256-GCM cipher roundtrip & auth-tag tamper rejection.
- [x] **Test 13**: Predictable document IDs cannot expose other documents.
- [x] **Test 14**: Unauthorized users cannot access sensitive document metadata.

---

## 📚 Technical Documentation

- 📐 [Architecture Reference](docs/ARCHITECTURE.md)
- 🛡️ [Security & Threat Model](docs/SECURITY.md)
- 🔌 [REST API Reference](docs/API.md)
- 🗄️ [Database Schema & ERD](docs/DATABASE.md)
- ☁️ [Deployment & Cloud Setup](docs/DEPLOYMENT.md)
- 🎬 [Live Demonstration Script (24 Steps)](docs/DEMO.md)

---

## ⚖️ Disclaimer
*SecureVault Prototype is designed for demonstration and hackathon evaluation using fictional demo data. Not affiliated with any official government organization.*
