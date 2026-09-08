import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db.js';
import { CryptoHasher } from '../crypto/hasher.js';
import { Aes256GcmCipher } from '../crypto/cipher.js';
import { defaultKeyManager } from '../crypto/keyManagement.js';
import { getStorageProvider } from '../storage/storageProvider.js';
import { DigitalSignatureEngine } from '../crypto/signatures.js';
import { AuditService } from '../services/auditService.js';
import { CustodyService } from '../services/custodyService.js';

export async function seedDemoData() {
  console.log('[SEED] Starting SecureVault DEMO DATA initialization...');
  const db = await getDb();
  const storage = getStorageProvider();
  DigitalSignatureEngine.initialize();

  // Clear existing demo tables
  await db.exec(`
    DELETE FROM document_tags;
    DELETE FROM tags;
    DELETE FROM digital_signatures;
    DELETE FROM document_integrity;
    DELETE FROM chain_of_custody;
    DELETE FROM evidence;
    DELETE FROM document_permissions;
    DELETE FROM document_versions;
    DELETE FROM documents;
    DELETE FROM case_members;
    DELETE FROM cases;
    DELETE FROM user_roles;
    DELETE FROM roles;
    DELETE FROM users;
    DELETE FROM departments;
    DELETE FROM audit_logs;
    DELETE FROM audit_chain;
    DELETE FROM security_alerts;
    DELETE FROM notifications;
    DELETE FROM share_links;
    DELETE FROM access_requests;
  `);

  console.log('[SEED] Reset prior data.');

  // 1. ROLES
  const roles = [
    { id: 'role_admin', name: 'ADMINISTRATOR', desc: 'System governance, user management, and case oversight' },
    { id: 'role_inv', name: 'INVESTIGATOR', desc: 'Case investigations, evidence intake, and report authoring' },
    { id: 'role_auditor', name: 'AUDITOR', desc: 'Tamper-evident audit verification and integrity auditing' },
  ];
  for (const r of roles) {
    await db.run(`INSERT INTO roles (id, name, description) VALUES ($1, $2, $3)`, [r.id, r.name, r.desc]);
  }

  // 2. DEPARTMENTS
  const departments = [
    { id: 'dept_cyber', name: 'Cyber Crime Division', code: 'CCD', desc: 'Specialized digital investigations, network forensics, and cyber incident response.' },
    { id: 'dept_inv', name: 'Investigation Division', code: 'INV', desc: 'General criminal investigations, field interviews, and evidence collection.' },
    { id: 'dept_legal', name: 'Legal Affairs', code: 'LGL', desc: 'Prosecution liaison, court orders, and judicial compliance.' },
    { id: 'dept_forensics', name: 'Digital Forensics', code: 'DFL', desc: 'Forensic hardware extraction, memory analysis, and cryptographic authentication.' },
  ];
  for (const d of departments) {
    await db.run(`INSERT INTO departments (id, name, code, description) VALUES ($1, $2, $3, $4)`, [d.id, d.name, d.code, d.desc]);
  }

  // 3. USERS
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const users = [
    {
      id: 'user_admin',
      email: 'admin@securevault.local',
      fullName: 'Chief Inspector Arthur Pendelton',
      badgeNumber: 'SV-ADM-001',
      deptId: 'dept_inv',
      role: 'ADMINISTRATOR',
    },
    {
      id: 'user_inv_a',
      email: 'inv.a@securevault.local',
      fullName: 'Senior Investigator Sharma',
      badgeNumber: 'SV-INV-104',
      deptId: 'dept_inv',
      role: 'INVESTIGATOR',
    },
    {
      id: 'user_inv_b',
      email: 'inv.b@securevault.local',
      fullName: 'Detective Marcus Vance',
      badgeNumber: 'SV-INV-102',
      deptId: 'dept_cyber',
      role: 'INVESTIGATOR',
    },
    {
      id: 'user_auditor',
      email: 'auditor@securevault.local',
      fullName: 'Inspector General Elena Rostova',
      badgeNumber: 'SV-AUD-900',
      deptId: 'dept_legal',
      role: 'AUDITOR',
    },
  ];

  for (const u of users) {
    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, badge_number, department_id, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
      [u.id, u.email, hashedPassword, u.fullName, u.badgeNumber, u.deptId, u.role]
    );
  }

  // 4. CASES
  const cases = [
    {
      id: 'case_101',
      caseNumber: 'CASE-2026-101',
      title: 'Project Apex Infrastructure Breach',
      desc: 'Unauthorized exfiltration of sensitive telemetry data from state power grid gateway.',
      deptId: 'dept_cyber',
      sensitivity: 'SECRET',
      creator: 'user_admin',
    },
    {
      id: 'case_102',
      caseNumber: 'CASE-2026-102',
      title: 'Financial Ledger Falsification Ring',
      desc: 'Systematic double-invoicing and offshore shell routing identified during forensic audit.',
      deptId: 'dept_inv',
      sensitivity: 'CONFIDENTIAL',
      creator: 'user_inv_b',
    },
    {
      id: 'case_103',
      caseNumber: 'CASE-2026-103',
      title: 'Judicial Warrant Intercept Investigation',
      desc: 'Tampering investigation into altered bail dispatch logs in district magistrate court.',
      deptId: 'dept_legal',
      sensitivity: 'SECRET',
      creator: 'user_admin',
    },
    {
      id: 'case_104',
      caseNumber: 'CASE-2026-104',
      title: 'Operation Nightshade: Vehicle Syndicate & Identity Forgery',
      desc: 'Multi-jurisdiction syndicate manufacturing fake vehicle registration plates (DL-01-AB-1234, MH 12 CD 5678) and forged Aadhaar credentials.',
      deptId: 'dept_inv',
      sensitivity: 'CONFIDENTIAL',
      creator: 'user_admin',
    },
  ];

  for (const c of cases) {
    await db.run(
      `INSERT INTO cases (id, case_number, title, description, department_id, sensitivity_level, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7)`,
      [c.id, c.caseNumber, c.title, c.desc, c.deptId, c.sensitivity, c.creator]
    );
  }

  // 5. CASE MEMBERSHIPS
  // Assign Investigator A to CASE-104 and CASE-101
  await db.run(`INSERT INTO case_members (id, case_id, user_id, role_in_case) VALUES ($1, $2, $3, $4)`, [
    uuidv4(),
    'case_104',
    'user_inv_a',
    'LEAD_INVESTIGATOR',
  ]);
  await db.run(`INSERT INTO case_members (id, case_id, user_id, role_in_case) VALUES ($1, $2, $3, $4)`, [
    uuidv4(),
    'case_101',
    'user_inv_a',
    'INVESTIGATOR',
  ]);

  // Assign Investigator B to CASE-102 (NOT CASE-104!)
  await db.run(`INSERT INTO case_members (id, case_id, user_id, role_in_case) VALUES ($1, $2, $3, $4)`, [
    uuidv4(),
    'case_102',
    'user_inv_b',
    'LEAD_INVESTIGATOR',
  ]);

  // 6. INITIAL AUDIT LOGS (Establish Genesis Chaining)
  await AuditService.logEvent(db, {
    userId: 'SYSTEM',
    userName: 'SecureVault Genesis Kernel',
    action: 'SYSTEM_INITIALIZATION',
    details: 'Cryptographic root ledger anchored. Genesis state established.',
  });

  await AuditService.logEvent(db, {
    userId: 'user_admin',
    userName: 'Chief Inspector Arthur Pendelton',
    action: 'CASE_ASSIGNED',
    resourceId: 'case_104',
    resourceType: 'CASE',
    caseId: 'case_104',
    details: 'Senior Investigator Sharma assigned to lead CASE-2026-104.',
  });

  // 7. DEMO DOCUMENTS FOR CASE-104
  const demoDocs = [
    {
      id: 'doc_fir_104',
      title: 'First Information Report - Case 104',
      filename: 'FIR_104.pdf',
      classification: 'FIR',
      confidence: 0.96,
      caseId: 'case_104',
      deptId: 'dept_inv',
      ownerId: 'user_inv_a',
      sensitivity: 'CONFIDENTIAL',
      content:
        `FIRST INFORMATION REPORT (Under Section 154 CrPC)\n` +
        `Police Station: Cyber Cell Headquarters, Sector 62\n` +
        `Case Reference: CASE-2026-104 | FIR No: 104/2026\n` +
        `Date of Occurrence: 12th August 2026 | Reported: 2026-08-14\n` +
        `Complainant: Transport Authority Inspector Rajesh K.\n` +
        `Accused: Unknown syndicate operators linked to vehicle registration DL-01-AB-1234 and MH 12 CD 5678.\n` +
        `Offences: Section 420 IPC, Section 468 IPC (Forgery), Section 66 IT Act.\n` +
        `Brief Facts: Recovered duplicate vehicle chassis plates, forged smart cards, and cloned identity documents.\n` +
        `Investigating Officer: Senior Investigator Sharma (Badge: SV-INV-104).`,
      tags: ['FIR', 'Police', 'Case-104', 'Criminal-Procedure'],
    },
    {
      id: 'doc_rep_104',
      title: 'Investigation Report: Syndicate Operation & Network',
      filename: 'Investigation_Report_104.pdf',
      classification: 'Investigation Report',
      confidence: 0.98,
      caseId: 'case_104',
      deptId: 'dept_inv',
      ownerId: 'user_inv_a',
      sensitivity: 'CONFIDENTIAL',
      content:
        `PRELIMINARY INVESTIGATION REPORT\n` +
        `Investigation Division | Special Operations Group\n` +
        `Subject: Investigation into vehicle evidence and document forgery in Case 104.\n` +
        `Suspects Identified: John Doe, alias "Apex Vector", operating out of Sector 62 warehouse.\n` +
        `Recovered Vehicle Evidence: Black SUV with fake license plate DL-01-AB-1234 equipped with GPS scrambler.\n` +
        `Financial Trails: Wire transfers totaling ₹48,50,000 originating from suspect account.\n` +
        `Witness Statements: Recorded under Section 161 CrPC. Confirms nocturnal deliveries of forged registration certs.\n` +
        `Status: Active surveillance ongoing. Immediate forensic validation of recovered memory modules recommended.`,
      tags: ['Investigation', 'Report', 'Evidence', 'Case-104', 'Vehicle-Evidence'],
    },
    {
      id: 'doc_ev_104',
      title: 'Evidence Seizure Memo & Property Log',
      filename: 'Evidence_Report_104.pdf',
      classification: 'Evidence',
      confidence: 0.94,
      caseId: 'case_104',
      deptId: 'dept_inv',
      ownerId: 'user_inv_a',
      sensitivity: 'CONFIDENTIAL',
      content:
        `SEIZURE MEMO & PHYSICAL EVIDENCE LOG\n` +
        `Case Reference: CASE-2026-104\n` +
        `Location of Recovery: Underground bay 4, Sector 62\n` +
        `Item No. EV-104-A: MicroSD Card (SanDisk 128GB) retrieved from suspect vehicle DL-01-AB-1234.\n` +
        `Item No. EV-104-B: 14 Embossed high-security registration plates.\n` +
        `Item No. EV-104-C: Laser engraving printer and blank PVC RFID chips.\n` +
        `Seized By: Senior Investigator Sharma in presence of independent panchas.\n` +
        `Seals Applied: Lacquer seal with SecureVault Tamper-Proof Tag #9021.`,
      tags: ['Evidence', 'Seizure', 'Custody', 'Case-104'],
    },
    {
      id: 'doc_for_104',
      title: 'Forensic Lab Report: Chip Cryptanalysis & Firmware Dump',
      filename: 'Forensic_Report_104.pdf',
      classification: 'Forensic Report',
      confidence: 0.99,
      caseId: 'case_104',
      deptId: 'dept_forensics',
      ownerId: 'user_inv_a',
      sensitivity: 'SECRET',
      content:
        `DIGITAL FORENSIC SCIENCE LABORATORY\n` +
        `Cyber Forensics & Hardware Analysis Division\n` +
        `Examination of Evidence Item EV-104-A (SanDisk 128GB MicroSD).\n` +
        `Forensic Imaging: Bit-stream copy created using hardware write-blocker.\n` +
        `Computed Image SHA-256: 4f8b2c6d9e1a3f5b7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c\n` +
        `Extracted Artifacts: 342 scanned vehicle title deeds, encrypted communications via Matrix protocol.\n` +
        `GPS Telemetry Extraction: Confirms vehicle MH 12 CD 5678 was parked at Sector 62 during the heist.\n` +
        `Examiner: Lead Forensic Analyst Elena Rostova.`,
      tags: ['Forensics', 'Digital-Evidence', 'Lab-Report', 'Case-104'],
    },
    {
      id: 'doc_crt_104',
      title: 'Court Order: Search Warrant & Evidence Admissibility',
      filename: 'Court_Order_104.pdf',
      classification: 'Court Order',
      confidence: 0.97,
      caseId: 'case_104',
      deptId: 'dept_legal',
      ownerId: 'user_admin',
      sensitivity: 'CONFIDENTIAL',
      content:
        `IN THE COURT OF THE PRINCIPAL DISTRICT & SESSIONS JUDGE\n` +
        `Special Cyber Court Jurisdiction | Case Reference: CASE-2026-104\n` +
        `Order on Criminal Miscellaneous Application No. 441/2026\n` +
        `Coram: Honorable Judge V. K. Deshmukh\n` +
        `Upon hearing Public Prosecutor for Legal Affairs and examining the Case Diary:\n` +
        `1. Search Warrant granted under Section 93 CrPC for premises located at Sector 62.\n` +
        `2. Electronic evidence admitted subject to Section 65B Indian Evidence Act certificate.\n` +
        `3. Custody of vehicle evidence DL-01-AB-1234 remanded to Forensic Science Lab until further orders.\n` +
        `Given under my hand and seal of the Court this 20th day of August 2026.`,
      tags: ['Court-Order', 'Judicial', 'Legal', 'Case-104'],
    },
  ];

  for (const doc of demoDocs) {
    const docBuffer = Buffer.from(doc.content, 'utf8');
    const sha256 = CryptoHasher.sha256(docBuffer);

    // Encrypt with AES-256-GCM
    const docKey = defaultKeyManager.getDocumentKey(doc.id);
    const encrypted = Aes256GcmCipher.encrypt(docBuffer, docKey);

    // Save to storage
    const storagePath = `vault_objects/${doc.id}_enc.bin`;
    await storage.saveObject(storagePath, encrypted.combined);

    // Entities
    const entities = [
      { type: 'CASE_ID', value: 'CASE-2026-104', confidence: 0.99 },
      { type: 'VEHICLE_NO', value: 'DL-01-AB-1234', confidence: 0.96 },
      { type: 'VEHICLE_NO', value: 'MH 12 CD 5678', confidence: 0.94 },
      { type: 'LEGAL_SECTION', value: 'Section 420 IPC', confidence: 0.98 },
      { type: 'LEGAL_SECTION', value: 'Section 66 IT Act', confidence: 0.97 },
      { type: 'LOCATION', value: 'Sector 62', confidence: 0.91 },
      { type: 'LOCATION', value: 'Cyber Cell Headquarters', confidence: 0.95 },
    ];

    const summary = `Official ${doc.classification} for CASE-2026-104. Pertains to vehicle evidence DL-01-AB-1234, document forgery operations, and forensic recovery in Sector 62.`;

    await db.run(
      `INSERT INTO documents (
        id, title, original_filename, mime_type, file_size, storage_path,
        sha256_hash, encryption_algo, encryption_key_id, case_id, department_id,
        owner_id, sensitivity_level, current_version, status,
        ai_classification, ai_confidence, ai_summary, ai_entities, ocr_extracted_text,
        is_tampered_demo, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'aes-256-gcm', $8, $9, $10, $11, $12, 1, 'ACTIVE', $13, $14, $15, $16, $17, 0, datetime('now'), datetime('now'))`,
      [
        doc.id,
        doc.title,
        doc.filename,
        'application/pdf',
        docBuffer.length,
        storagePath,
        sha256,
        `key_hkdf_${doc.id.slice(0, 8)}`,
        doc.caseId,
        doc.deptId,
        doc.ownerId,
        doc.sensitivity,
        doc.classification,
        doc.confidence,
        summary,
        JSON.stringify(entities),
        doc.content,
      ]
    );

    // Initial version
    await db.run(
      `INSERT INTO document_versions (id, document_id, version_number, storage_path, sha256_hash, file_size, created_by, change_summary, created_at)
       VALUES ($1, $2, 1, $3, $4, $5, $6, 'Initial cryptographic evidence upload', datetime('now'))`,
      [uuidv4(), doc.id, storagePath, sha256, docBuffer.length, doc.ownerId]
    );

    // Tags
    for (const tag of doc.tags) {
      await db.run(`INSERT INTO tags (id, name, created_at) VALUES ($1, $2, datetime('now')) ON CONFLICT(name) DO NOTHING`, [uuidv4(), tag]);
      const tagRow = await db.get<any>(`SELECT id FROM tags WHERE name = $1`, [tag]);
      if (tagRow) {
        await db.run(`INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [doc.id, tagRow.id]);
      }
    }

    // Digital signature on court order & FIR
    if (doc.classification === 'Court Order' || doc.classification === 'FIR') {
      const sigMeta = DigitalSignatureEngine.signHash(sha256, 'user_admin', 'Chief Inspector Arthur Pendelton');
      await db.run(
        `INSERT INTO digital_signatures (id, document_id, signer_id, signer_name, signed_hash, signature_hex, key_fingerprint, algorithm, certificate_authority, signed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          uuidv4(),
          doc.id,
          'user_admin',
          'Chief Inspector Arthur Pendelton',
          sha256,
          sigMeta.signatureHex,
          sigMeta.keyFingerprint,
          sigMeta.algorithm,
          sigMeta.certificateAuthority,
          sigMeta.signedAt,
        ]
      );
    }

    // Document integrity initial verification record
    await db.run(
      `INSERT INTO document_integrity (id, document_id, registered_hash, verified_hash, status, verified_by, verified_at)
       VALUES ($1, $2, $3, $4, 'VERIFIED', 'user_auditor', datetime('now'))`,
      [uuidv4(), doc.id, sha256, sha256]
    );

    // Audit log
    await AuditService.logEvent(db, {
      userId: doc.ownerId,
      userName: 'Senior Investigator Sharma',
      action: 'DOCUMENT_UPLOAD_ENCRYPTED',
      resourceId: doc.id,
      resourceType: 'DOCUMENT',
      caseId: doc.caseId,
      details: { filename: doc.filename, sha256, classification: doc.classification },
    });
  }

  // 8. EVIDENCE & CHAIN OF CUSTODY
  const ev1Id = 'ev_104_microsd';
  const evHash = CryptoHasher.sha256('SAN_DISK_128GB_MICRO_SD_CHIP_RAW_DUMP_001');

  await db.run(
    `INSERT INTO evidence (id, evidence_number, title, description, case_id, document_id, current_custodian_id, status, storage_location, integrity_hash, collected_at, created_at, updated_at)
     VALUES ($1, 'EV-2026-104-A', 'SanDisk 128GB High-Speed MicroSD Card', 'Recovered from concealed compartment under steering console of vehicle DL-01-AB-1234.', 'case_104', 'doc_ev_104', 'user_inv_a', 'IN_ANALYSIS', 'Forensic Vault A-12', $2, datetime('now'), datetime('now'), datetime('now'))`,
    [ev1Id, evHash]
  );

  // Custody steps
  const custodySteps = [
    { prev: 'Scene of Crime Bay 4', next: 'Senior Investigator Sharma', action: 'COLLECTED', reason: 'Field seizure during raid' },
    { prev: 'Senior Investigator Sharma', next: 'Forensic Intake Officer Marcus', action: 'TRANSFERRED', reason: 'Delivered to Digital Forensics for chip decapsulation' },
    { prev: 'Forensic Intake Officer Marcus', next: 'Inspector General Elena Rostova', action: 'EVIDENCE_REVIEW', reason: 'Forensic integrity & hash chain validation' },
  ];

  for (const step of custodySteps) {
    await CustodyService.recordTransfer(db, {
      evidenceId: ev1Id,
      caseId: 'case_104',
      previousCustodian: step.prev,
      newCustodian: step.next,
      action: step.action as any,
      reason: step.reason,
      performedById: 'user_inv_a',
      integrityHash: evHash,
      signatureStatus: 'VERIFIED',
    });
  }

  // 9. SAMPLE SECURITY ALERTS
  await db.run(
    `INSERT INTO security_alerts (id, alert_type, severity, user_id, resource_id, case_id, description, reasons, risk_score, created_at)
     VALUES ($1, 'FAILED_LOGINS', 'MEDIUM', 'user_inv_b', NULL, NULL, 'Failed login threshold warning: 3 incorrect passwords recorded from IP 192.168.1.104', $2, 45, datetime('now'))`,
    [uuidv4(), JSON.stringify(['Multiple password mismatches detected within 10-minute window.', 'Origin IP address does not match frequent subnet.'])]
  );

  console.log('[SEED] Successfully seeded DEMO DATA for SECUREVAULT.');
}

// Run directly if invoked from command line
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED ERROR]', err);
      process.exit(1);
    });
}
