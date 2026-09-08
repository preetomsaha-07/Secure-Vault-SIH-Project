# SECUREVAULT Live Demonstration Walkthrough (24 Steps)

This walkthrough matches the required live hackathon presentation flow specified in **Section 53**.

---

### Step 1: Login as Administrator
- Open the application at `http://localhost:3000`.
- In the top demo persona switcher bar, click **👑 Admin** (Chief Inspector Arthur Pendelton).
- Verify administrator clearance badge in dashboard header.

### Step 2: Select Investigation Division
- Click **Cases & Investigations** in the sidebar.
- Inspect the department tags and filters; note "Investigation Division".

### Step 3: Select CASE-2026-104
- Click on **CASE-2026-104: Operation Nightshade**.
- Review the case mandate, sensitivity (`CONFIDENTIAL`), and attached documents.

### Step 4: Verify Investigator A Assignment
- Under **Assigned Personnel**, confirm **Senior Investigator Sharma (SV-INV-104)** is listed as Lead Investigator.

### Step 5: Login as Investigator A
- In the top demo persona switcher, click **🔍 Inv A (Lead 104)**.
- Observe the active session instantly updates to Senior Investigator Sharma.

### Step 6: Upload a Fictional Investigation Document
- Click **Upload Evidence** in the sidebar or dashboard.
- Select a PDF or image document (e.g. `New_Evidence_Transcript.pdf`).
- Associate with **CASE-2026-104**.

### Steps 7 - 10: Observe the 8-Stage Cryptographic Pipeline
Watch the animated pipeline execute:
- **Step 7**: File validation & magic bytes check (%PDF-).
- **Step 8**: SHA-256 fingerprint generated.
- **Step 9**: AES-256-GCM envelope authenticated encryption applied.
- **Step 10**: Encrypted ciphertext transmitted to secure storage and relational metadata recorded.

### Steps 11 - 12: OCR & AI Classification
- **Step 11**: Local OCR engine extracts text strings.
- **Step 12**: AI classifies document as **Investigation Report** with confidence score ($\approx 96\%$) and suggested tags (`Investigation`, `Evidence`, `Case-104`).

### Step 13: Investigator B Attempts Unauthorized Access
- In the top persona switcher, switch to **🚫 Inv B (Marcus Vance)**.
- Marcus Vance is only assigned to Case 102.
- Click **Cases & Investigations** and attempt to open Case 104 or open Document 104 directly:
- **Result**: Immediate **🚫 ACCESS DENIED (403 Forbidden)** modal. Zero metadata is leaked.

### Step 14: Audit Log Records Unauthorized Attempt
- The unauthorized BOLA attempt is immediately committed to the tamper-evident audit ledger with IP and timestamp.

### Step 15: Auditor Opens Security Event
- In the persona switcher, click **🛡️ Auditor** (Inspector General Elena Rostova).
- Open **Security Incident Center** in the sidebar.
- Observe the newly flagged high-severity incident: `UNAUTHORIZED_ACCESS by Detective Marcus Vance on Case 104`.
- Review explainable risk reasons.

### Step 16: Verify Document Integrity
- Click **Documents & Files** and inspect `FIR_104.pdf`.
- Click **Document Integrity & Tamper Lab** tab.
- Click **Verify Integrity Now**.
- **Result**: **✅ INTEGRITY VERIFIED** (Original registered SHA-256 fingerprint matches stored ciphertext exactly).

### Step 17: Controlled Tampering Demonstration
- On the same document page, click **Simulate Tampering on Demo Copy**.
- Click **Verify Integrity Now**.
- **Result**: **🚨 DOCUMENT INTEGRITY COMPROMISED** (Stored hash mismatch / corrupt authentication tag).
- Click **Restore Pristine Copy** to return to authentic state.

### Step 18: Verify Audit Chain
- Click **Audit Trail Ledger** in the sidebar.
- Click **Verify Audit Chain**.
- **Result**: **✅ AUDIT CHAIN VERIFIED** (All blocks from Genesis anchor verified 100%).
- *(Optional)*: Click **Demonstrate Audit Tampering** to observe **🚨 AUDIT CHAIN INTEGRITY FAILED**, then click **Re-anchor / Repair Chain**.

### Step 19: Chain of Custody Timeline
- Click **Digital Evidence** in the sidebar.
- Select `EV-2026-104-A: SanDisk 128GB MicroSD Card`.
- Observe the visual custody timeline tracking transfers from Scene of Crime $\to$ Senior Inv Sharma $\to$ Forensic Lab $\to$ Elena Rostova.

### Step 20: Digital Signatures
- Open document `FIR_104.pdf` $\to$ **Digital Signatures** tab.
- Observe **✅ SIGNATURE VALID** with RSA-PSS 2048-bit key fingerprint.

### Step 21: Investigation Relationship Graph
- Click **Investigation Graph** in the sidebar.
- Observe interactive network nodes linking Case 104 to suspects, vehicle plates (`DL-01-AB-1234`, `MH 12 CD 5678`), locations (`Sector 62`), and physical evidence.
- Click any node to inspect clearance-filtered forensic metadata in the slide-out drawer.

### Step 22: Smart Search
- Click **Smart Search** in the sidebar.
- Run the natural language query:
  > *"Find investigation documents related to vehicle evidence in Case 104"*
- Observe the semantic parser extract Case 104, classification filter, and vehicle keywords, returning authorized documents with OCR snippets.

### Step 23: AI Executive Summary
- Click on any returned document.
- Open **AI Classification & Forensics** tab.
- Review the synthesized AI Executive Summary and extracted forensic entities.
- Click **Edit Classification** to demonstrate authorized human-in-the-loop editing.

### Step 24: Security Dashboard
- Return to **Dashboard** and **Security Incident Center**.
- Review total verified documents, live threat posture gauge, and risk metrics.
