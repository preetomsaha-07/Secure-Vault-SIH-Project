import {
  User,
  Department,
  Case,
  CaseMember,
  DocumentRecord,
  EvidenceRecord,
  CustodyEvent,
  AuditRecord,
  SecurityAlert,
  AccessRequest,
  GraphData,
  DigitalSignatureRecord,
} from '../types';

export const MOCK_USERS: Record<string, User> = {
  admin: {
    id: 'user_admin',
    email: 'admin@securevault.local',
    fullName: 'Dr. Vikramaditya Sen, IPS',
    badgeNumber: 'IPS-2011-DL04',
    role: 'ADMINISTRATOR',
    departmentId: 'dept_cyber',
    departmentName: 'Central Cyber Crime Investigation Cell (C3IC)',
    departmentCode: 'C3IC',
    mfaEnabled: true,
  },
  inv_a: {
    id: 'user_inv_a',
    email: 'inv.a@securevault.local',
    fullName: 'Inspector Preetom Saha',
    badgeNumber: 'SV-CYBER-704',
    role: 'INVESTIGATOR',
    departmentId: 'dept_inv',
    departmentName: 'Special Anti-Cartel & Digital Forensics Wing',
    departmentCode: 'SDFW',
    mfaEnabled: true,
  },
  inv_b: {
    id: 'user_inv_b',
    email: 'inv.b@securevault.local',
    fullName: 'DSP Rajesh Nair',
    badgeNumber: 'EOW-DSP-218',
    role: 'INVESTIGATOR',
    departmentId: 'dept_eow',
    departmentName: 'Economic Offences Wing & Financial Forensics',
    departmentCode: 'EOW',
    mfaEnabled: false,
  },
  auditor: {
    id: 'user_auditor',
    email: 'auditor@securevault.local',
    fullName: 'Advocate Meenakshi Sundaram',
    badgeNumber: 'BAR-DLI-1998/412',
    role: 'AUDITOR',
    departmentId: 'dept_legal',
    departmentName: 'Directorate of Prosecution & Judicial Liaison',
    departmentCode: 'DPJL',
    mfaEnabled: true,
  },
};

export const MOCK_DEPARTMENTS: Department[] = [
  {
    id: 'dept_cyber',
    name: 'Central Cyber Crime Investigation Cell (C3IC)',
    code: 'C3IC',
    description: 'National cyber incident response, SCADA grid security, APT intrusion tracing, and CERT-In coordination.',
  },
  {
    id: 'dept_inv',
    name: 'Special Anti-Cartel & Digital Forensics Wing',
    code: 'SDFW',
    description: 'Inter-state organized crime syndicates, vehicle racket operations, counterfeit credential recovery, and field forensics.',
  },
  {
    id: 'dept_eow',
    name: 'Economic Offences Wing & Financial Forensics',
    code: 'EOW',
    description: 'Multi-crore banking Trojan wire frauds, shell corporate circular routing, and Prevention of Money Laundering Act (PMLA) investigations.',
  },
  {
    id: 'dept_legal',
    name: 'Directorate of Prosecution & Judicial Liaison',
    code: 'DPJL',
    description: 'Special Public Prosecution, Section 65B / Section 63 BSA electronic certifications, and High Court appellate compliance.',
  },
  {
    id: 'dept_forensics',
    name: 'Central Forensic Science Laboratory (CFSL CBI New Delhi)',
    code: 'CFSL',
    description: 'Government accredited ISO/IEC 27037 digital forensics, hardware write-blocker imaging, chip-off JTAG extraction, and hash verification.',
  },
];

export const MOCK_CASES: Case[] = [
  {
    id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    title: 'State (NCT of Delhi) v. Inter-State VAHAN RTO Syndicate & Cloned HSRP Network',
    description: 'Inter-state syndicate exploiting compromised Regional Transport Office (VAHAN 4.0) portal credentials to manufacture counterfeit High-Security Registration Plates (DL-01-AB-1234, MH-12-CD-5678) and register stolen luxury vehicles onto the national Parivahan database. Offenses under Sections 318(4), 336(3), 340(2) BNS (Sec 420, 468, 471 IPC) & Sec 66C/66D Information Technology Act, 2000.',
    department_id: 'dept_inv',
    department_name: 'Special Anti-Cartel & Digital Forensics Wing',
    department_code: 'SDFW',
    sensitivity_level: 'CONFIDENTIAL',
    status: 'ACTIVE',
    creator_name: 'Dr. Vikramaditya Sen, IPS',
    member_count: 2,
    document_count: 5,
    evidence_count: 4,
    created_at: '2024-08-14T11:20:00Z',
  },
  {
    id: 'case_101',
    case_number: 'CASE-2024-CBI-101',
    title: 'CBI (STF) v. Power Grid SLDC SCADA Telemetry Exfiltration (Operation PowerShield)',
    description: 'National Critical Information Infrastructure Protection Centre (NCIIPC) and CERT-In advisory CIAD-2024-0018. Targeted Advanced Persistent Threat (APT) malware infiltrating 66kV transmission substation SCADA gateways and State Load Despatch Center (SLDC). Unauthorized exfiltration of operational telemetry and firmware tampering. Sections 66F IT Act (Cyber Terrorism) & Sec 43/66 IT Act.',
    department_id: 'dept_cyber',
    department_name: 'Central Cyber Crime Investigation Cell (C3IC)',
    department_code: 'C3IC',
    sensitivity_level: 'TOP_SECRET',
    status: 'ACTIVE',
    creator_name: 'Dr. Vikramaditya Sen, IPS',
    member_count: 2,
    document_count: 3,
    evidence_count: 2,
    created_at: '2024-08-01T10:00:00Z',
  },
  {
    id: 'case_102',
    case_number: 'CASE-2024-EOW-102',
    title: 'State v. Apex Shell Corporate Invoicing & Hawala Remittance Syndicate',
    description: 'Forensic financial audit revealing multi-layered banking Trojan wire transfers and fake input tax credit (ITC) circular routing totaling ₹62,40,00,000 across 18 dummy corporate exporters in Mumbai, Surat, and Dubai. Offenses under Sections 409, 420, 477A IPC and Sections 3 & 4 of Prevention of Money Laundering Act (PMLA).',
    department_id: 'dept_eow',
    department_name: 'Economic Offences Wing & Financial Forensics',
    department_code: 'EOW',
    sensitivity_level: 'CONFIDENTIAL',
    status: 'ACTIVE',
    creator_name: 'DSP Rajesh Nair',
    member_count: 1,
    document_count: 2,
    evidence_count: 2,
    created_at: '2024-08-10T14:30:00Z',
  },
  {
    id: 'case_103',
    case_number: 'CASE-2024-HC-103',
    title: 'In Re: High Court Registry Tampered Electronic Bail Dispatch Warrants',
    description: 'Judicial High Court Vigilance probe into forged cryptographic digital signatures and compromised clerk credentials used to transmit fraudulent electronic bail release warrants directly to District Central Jail superintendents. Offenses under Sections 193, 204, 466 IPC and Section 66 IT Act.',
    department_id: 'dept_legal',
    department_name: 'Directorate of Prosecution & Judicial Liaison',
    department_code: 'DPJL',
    sensitivity_level: 'SECRET',
    status: 'UNDER_REVIEW',
    creator_name: 'Dr. Vikramaditya Sen, IPS',
    member_count: 2,
    document_count: 2,
    evidence_count: 1,
    created_at: '2024-08-15T09:15:00Z',
  },
];

export const MOCK_CASE_MEMBERS: Record<string, CaseMember[]> = {
  case_104: [
    {
      id: 'cm_104_1',
      case_id: 'case_104',
      user_id: 'user_inv_a',
      full_name: 'Inspector Preetom Saha',
      email: 'inv.a@securevault.local',
      badge_number: 'SV-CYBER-704',
      role: 'INVESTIGATOR',
      role_in_case: 'LEAD_INVESTIGATOR',
      assigned_at: '2024-08-14T11:25:00Z',
    },
    {
      id: 'cm_104_2',
      case_id: 'case_104',
      user_id: 'user_admin',
      full_name: 'Dr. Vikramaditya Sen, IPS',
      email: 'admin@securevault.local',
      badge_number: 'IPS-2011-DL04',
      role: 'ADMINISTRATOR',
      role_in_case: 'SUPERVISOR',
      assigned_at: '2024-08-14T11:20:00Z',
    },
  ],
  case_102: [
    {
      id: 'cm_102_1',
      case_id: 'case_102',
      user_id: 'user_inv_b',
      full_name: 'DSP Rajesh Nair',
      email: 'inv.b@securevault.local',
      badge_number: 'EOW-DSP-218',
      role: 'INVESTIGATOR',
      role_in_case: 'LEAD_INVESTIGATOR',
      assigned_at: '2024-08-10T14:35:00Z',
    },
  ],
};

export const MOCK_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'doc_fir_104',
    title: 'First Information Report (FIR No. 0412/2024 - P.S. Cyber Crime)',
    original_filename: 'FIR_0412_2024_CyberCrime_Sec62.pdf',
    mime_type: 'application/pdf',
    file_size: 1048576,
    sha256_hash: '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b',
    encryption_algo: 'aes-256-gcm',
    case_id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    case_title: 'State (NCT of Delhi) v. Inter-State VAHAN RTO Syndicate & Cloned HSRP Network',
    department_id: 'dept_inv',
    department_name: 'Special Anti-Cartel & Digital Forensics Wing',
    owner_id: 'user_inv_a',
    owner_name: 'Inspector Preetom Saha',
    sensitivity_level: 'CONFIDENTIAL',
    current_version: 1,
    status: 'ACTIVE',
    ai_classification: 'FIR',
    ai_confidence: 0.98,
    ai_summary: 'Official FIR registered under Section 154 CrPC (Sec 173 BNSS). Pertains to unauthorized master database manipulation in national VAHAN 4.0 portal, cloned registration marks DL-01-AB-1234 and MH-12-CD-5678, counterfeit High-Security Registration Plates, and illegal smart card chip flashing.',
    ai_entities: JSON.stringify([
      { type: 'CASE_ID', value: 'CASE-2024-ND-412', confidence: 0.99 },
      { type: 'FIR_NO', value: 'FIR 0412/2024', confidence: 0.99 },
      { type: 'VEHICLE_NO', value: 'DL-01-AB-1234', confidence: 0.98 },
      { type: 'VEHICLE_NO', value: 'MH-12-CD-5678', confidence: 0.97 },
      { type: 'LEGAL_SECTION', value: 'Section 318(4) BNS / Sec 420 IPC', confidence: 0.98 },
      { type: 'LEGAL_SECTION', value: 'Section 336(3) BNS / Sec 468 IPC', confidence: 0.98 },
      { type: 'LEGAL_SECTION', value: 'Section 66C & 66D IT Act', confidence: 0.99 },
      { type: 'LOCATION', value: 'Sector 62 Underground Bay 4, Noida', confidence: 0.95 },
    ]),
    aiEntities: [
      { type: 'CASE_ID', value: 'CASE-2024-ND-412' },
      { type: 'FIR_NO', value: 'FIR 0412/2024' },
      { type: 'VEHICLE_NO', value: 'DL-01-AB-1234' },
      { type: 'VEHICLE_NO', value: 'MH-12-CD-5678' },
      { type: 'LEGAL_SECTION', value: 'Section 318(4) BNS / Sec 420 IPC' },
      { type: 'LEGAL_SECTION', value: 'Section 336(3) BNS / Sec 468 IPC' },
      { type: 'LEGAL_SECTION', value: 'Section 66C & 66D IT Act' },
      { type: 'LOCATION', value: 'Sector 62 Underground Bay 4, Noida' },
    ],
    ocr_extracted_text: `FIRST INFORMATION REPORT
(Under Section 154 Cr.P.C. / Section 173 Bharatiya Nagarik Suraksha Sanhita, 2023)
1. District: Gautam Buddha Nagar | Police Station: Cyber Crime Police Station, Sector 62
2. FIR No.: 0412/2024 | Date & Hour of Occurrence: 12-Aug-2024 between 01:30 and 04:00 hrs
3. Acts & Sections:
   (i) Bharatiya Nyaya Sanhita, 2023: Sec 318(4) [Cheating], Sec 336(3) [Forgery of valuable security], Sec 340(2) [Using forged record as genuine]
   (ii) Information Technology Act, 2000: Sec 66C [Identity Theft], Sec 66D [Cheating by Personation using Computer Resource]
   (iii) Motor Vehicles Act, 1988: Sec 192A [Using vehicle without registration]
4. Complainant / Informant: Shri Rajesh Kumar, Inspector of Motor Vehicles, Regional Transport Authority (RTA)
5. Details of Suspect: Rakesh Verma alias "Apex Vector" and accomplice Vikram Solanki (ex-RTO contractual operator)
6. Brief Facts: Informant reported unauthorized alteration of master chassis records in the VAHAN database. Two luxury motor vehicles bearing cloned registration marks DL-01-AB-1234 (Toyota Fortuner 4x4) and MH-12-CD-5678 (Hyundai Creta) detected operating with forged High Security Registration Plates (HSRP) and cloned Mifare 1K smart cards.
7. Investigating Officer: Inspector Preetom Saha, Cyber Forensics & Digital Investigation Cell (Badge: SV-CYBER-704).`,
    is_tampered_demo: 0,
    created_at: '2024-08-14T12:00:00Z',
    updated_at: '2024-08-14T12:00:00Z',
    tags: ['FIR', 'Police', 'Case-104', 'Criminal-Procedure', 'BNSS-173'],
    digitalSignature: {
      id: 'sig_104_fir',
      document_id: 'doc_fir_104',
      signer_id: 'user_admin',
      signer_name: 'Dr. Vikramaditya Sen, IPS',
      signed_hash: '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b',
      signature_hex: 'a4b1c2d3e4f5061728394a5b6c7d8e9fa0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
      key_fingerprint: 'SHA256:7f8e9d0c1b2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
      algorithm: 'RSA-PSS-SHA256-4096',
      certificate_authority: 'SecureVault Root Authority (Govt. of India e-Sign PKI)',
      signed_at: '2024-08-14T12:05:00Z',
    },
    latestIntegrityCheck: {
      id: 'chk_104_fir',
      document_id: 'doc_fir_104',
      registered_hash: '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b',
      verified_hash: '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b',
      status: 'VERIFIED',
      verified_by: 'Advocate Meenakshi Sundaram',
      verified_at: '2024-08-25T10:00:00Z',
    },
  },
  {
    id: 'doc_rep_104',
    title: 'Case Diary & Field Investigation Dossier (Under Sec 172 CrPC)',
    original_filename: 'Case_Diary_Vol1_FIR_412_2024.pdf',
    mime_type: 'application/pdf',
    file_size: 2097152,
    sha256_hash: '8f14e45fceea167a5a36dedd4bea2543add704e46bb25077273fc45ab6409ecf',
    encryption_algo: 'aes-256-gcm',
    case_id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    case_title: 'State (NCT of Delhi) v. Inter-State VAHAN RTO Syndicate & Cloned HSRP Network',
    department_id: 'dept_inv',
    department_name: 'Special Anti-Cartel & Digital Forensics Wing',
    owner_id: 'user_inv_a',
    owner_name: 'Inspector Preetom Saha',
    sensitivity_level: 'CONFIDENTIAL',
    current_version: 1,
    status: 'ACTIVE',
    ai_classification: 'Investigation Report',
    ai_confidence: 0.98,
    ai_summary: 'Comprehensive Case Diary under Section 172 CrPC recording Call Detail Record (CDR) tower triangulation, IPDR logs of unauthorized logins from ISP subnet 103.21.244.0/22, raid at Sector 62 underground bay, and freeze order under Section 102 CrPC on ₹48,50,000 illicit proceeds.',
    aiEntities: [
      { type: 'CASE_ID', value: 'CASE-2024-ND-412' },
      { type: 'SUSPECT', value: 'Rakesh Verma ("Apex Vector")' },
      { type: 'VEHICLE_NO', value: 'DL-01-AB-1234' },
      { type: 'LOCATION', value: 'Sector 62 Underground Bay 4, Noida' },
      { type: 'SEIZED_AMOUNT', value: '₹48,50,000' },
    ],
    ocr_extracted_text: `CASE DIARY UNDER SECTION 172 Cr.P.C.
POLICE STATION: Cyber Crime Police Station, Sector 62 | FIR No.: 0412/2024
Investigating Officer: Inspector Preetom Saha, SDFW

1. Investigative Findings:
Surveillance teams tracked telemetry from cloned Toyota Fortuner DL-01-AB-1234 using fast-tag sensor logs across Eastern Peripheral Expressway. The vehicle was parked within a commercial basement workshop at Sector 62, Noida.
2. Raid & Interception:
At 03:30 hrs, a tactical entry team raided the workshop. Prime operator Rakesh Verma alias "Apex Vector" and technician Vikram Solanki were detained on site.
3. Seizures at Location:
Seized one Evolis Primacy high-precision card encoder, 14 units of laser-etched HSRP plates, 128GB SanDisk high-speed MicroSD storage module containing master VAHAN dump files, and cash currency amounting to ₹48,50,000.
4. Action under Section 102 Cr.P.C.:
Bank accounts at State Bank of India (Janakpuri Branch) and ICICI Bank (Sector 62) frozen under Sec 102 CrPC. Seized items sealed under formal Panchnama with tamper-proof cryptographic barcodes.`,
    is_tampered_demo: 0,
    created_at: '2024-08-16T15:30:00Z',
    updated_at: '2024-08-16T15:30:00Z',
    tags: ['Case-Diary', 'CrPC-172', 'Investigation', 'Raid-Report', 'Case-104'],
  },
  {
    id: 'doc_ev_104',
    title: 'Panchnama & Digital Evidence Seizure Memo (Under Sec 100 CrPC)',
    original_filename: 'Panchnama_Seizure_Sector62_Underground.pdf',
    mime_type: 'application/pdf',
    file_size: 524288,
    sha256_hash: '9c56cc51b374c3ba189210d5b6f4d57f0743b1eee923414004a613232266b81e',
    encryption_algo: 'aes-256-gcm',
    case_id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    case_title: 'State (NCT of Delhi) v. Inter-State VAHAN RTO Syndicate & Cloned HSRP Network',
    department_id: 'dept_inv',
    department_name: 'Special Anti-Cartel & Digital Forensics Wing',
    owner_id: 'user_inv_a',
    owner_name: 'Inspector Preetom Saha',
    sensitivity_level: 'CONFIDENTIAL',
    current_version: 1,
    status: 'ACTIVE',
    ai_classification: 'Evidence',
    ai_confidence: 0.96,
    ai_summary: 'Legal Panchnama drawn up in presence of independent panch witnesses (Shri Alok Mishra & Shri Harish Chandra). Details seizure of 4 physical forensic evidence exhibits sealed in Faraday anti-static pouches under tamper-evident seal #9021.',
    aiEntities: [
      { type: 'EVIDENCE_TAG', value: 'CFSL-2024-E412-A' },
      { type: 'EVIDENCE_TAG', value: 'CFSL-2024-E412-B' },
      { type: 'PANCHARAMA_SEAL', value: 'LACQUER-SEAL-#9021' },
      { type: 'WITNESS', value: 'Alok Mishra & Harish Chandra' },
    ],
    ocr_extracted_text: `PANCHNAMA (SEIZURE MEMO UNDER SECTION 100 Cr.P.C.)
Place of Execution: Underground Bay 4, Commercial Complex, Sector 62, Noida
Date & Time: 16th August 2024 at 04:15 hrs
Panchas (Independent Witnesses):
1. Shri Alok Mishra, aged 42 yrs, r/o H-44, Sector 61, Noida
2. Shri Harish Chandra, aged 38 yrs, r/o B-12, Sector 63, Noida

We, the aforesaid panchas, were summoned by Inspector Preetom Saha of SDFW. In our presence and sight, the following articles were recovered and seized:
Item 1: MicroSD Card 128GB SanDisk Extreme PRO, recovered from vehicle DL-01-AB-1234 dash console. Placed in Anti-Static Faraday Bag, sealed with paper seal bearing signatures of panchas. (Marked Exhibit CFSL-2024-E412-A)
Item 2: 14 Embossed High Security Registration Plates bearing duplicate series DL-01-AB-1234 and MH-12-CD-5678. (Marked Exhibit CFSL-2024-E412-B)
Item 3: OnePlus 11 5G smartphone (IMEI: 869402058192031) seized from suspect Rakesh Verma. (Marked Exhibit CFSL-2024-E412-C)
Item 4: Evolis Primacy Industrial Smart Card Embosser & 200 blank RFID cards. (Marked Exhibit CFSL-2024-E412-D)
Seals applied: Official lacquer seal of Cyber Crime Police Station with Tag #9021. Contents verified and read over to panchas.`,
    is_tampered_demo: 0,
    created_at: '2024-08-16T09:45:00Z',
    updated_at: '2024-08-16T09:45:00Z',
    tags: ['Panchnama', 'Seizure-Memo', 'Section-100-CrPC', 'Witness-Attested', 'Case-104'],
  },
  {
    id: 'doc_for_104',
    title: 'CFSL Cyber Forensic Examination Certificate (CFSL/CBI/ND/2024/CYBER/891)',
    original_filename: 'CFSL_Lab_Report_CFSL-CBI-ND-2024-891.pdf',
    mime_type: 'application/pdf',
    file_size: 4194304,
    sha256_hash: '2c6d9e1a3f5b7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c4f8b',
    encryption_algo: 'aes-256-gcm',
    case_id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    case_title: 'State (NCT of Delhi) v. Inter-State VAHAN RTO Syndicate & Cloned HSRP Network',
    department_id: 'dept_forensics',
    department_name: 'Central Forensic Science Laboratory (CFSL CBI New Delhi)',
    owner_id: 'user_inv_a',
    owner_name: 'Inspector Preetom Saha',
    sensitivity_level: 'SECRET',
    current_version: 1,
    status: 'ACTIVE',
    ai_classification: 'Forensic Report',
    ai_confidence: 0.99,
    ai_summary: 'Central Forensic Science Laboratory examination report under Section 293 CrPC. Conforms to ISO/IEC 27037 standards. Bit-stream physical imaging on Tableau T8u write-blocker yielded 342 forged vehicle registration records, cryptographic hash integrity confirmation (SHA-256 & MD5 match), and unencrypted Matrix protocol chat logs.',
    aiEntities: [
      { type: 'LAB_REF', value: 'CFSL/CBI/ND/2024/CYBER/891' },
      { type: 'EXAMINER', value: 'Dr. Ananya Mukherjee, Principal Scientific Officer' },
      { type: 'STANDARDS', value: 'ISO/IEC 27037:2012' },
      { type: 'HASH_STATUS', value: '100% Bit-Stream Match' },
    ],
    ocr_extracted_text: `GOVERNMENT OF INDIA | MINISTRY OF HOME AFFAIRS
CENTRAL FORENSIC SCIENCE LABORATORY (CBI)
CGO Complex, Lodhi Road, New Delhi - 110003
REPORT OF THE DIGITAL FORENSICS SCIENCE DIVISION
Report No: CFSL/CBI/ND/2024/CYBER/891 | Dated: 20-Aug-2024
To: The Chief Metropolitan Magistrate, Patiala House Courts, New Delhi

1. Reference: Letter No. SDFW/CYBER/2024/718 dated 17-Aug-2024 from Inspector Preetom Saha.
2. Examination of Parcel 'A' (Exhibit CFSL-2024-E412-A):
   - Description: SanDisk Extreme PRO 128GB MicroSDXC card (Serial: 2311894001).
   - Seals Intact: Official lacquer seal #9021 verified intact.
3. Forensic Acquisition Methodology:
   - Hardware: Tableau T8u Forensic USB 3.0 Bridge (Hardware Write-Blocker).
   - Software: FTK Imager v4.7.1 in Raw (.dd) and Expert Witness Format (.E01).
   - Acquired Image SHA-256: 4f8b2c6d9e1a3f5b7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c
   - Acquired Image MD5: 9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d
   - Verification Result: Verified 100% hash match with source storage media.
4. Laboratory Findings:
   (a) Carved unallocated space recovered 342 high-resolution scans of vehicle registration certificates (RCs).
   (b) Extracted SQLite databases revealed Matrix messaging chat transcripts coordinating fake HSRP deliveries between Rakesh Verma and Vikram Solanki.
   (c) Exif metadata and GPS telemetry from recovered photos confirm physical presence at Sector 62 workshop during illegal stamp fabrications.
Opinion: The examined exhibits contain incontrovertible digital artifacts of deliberate database counterfeiting and registration forgery.
Examiner: Dr. Ananya Mukherjee, M.Sc., Ph.D., Principal Scientific Officer (Digital Forensics), CFSL CBI.`,
    is_tampered_demo: 0,
    created_at: '2024-08-20T14:10:00Z',
    updated_at: '2024-08-20T14:10:00Z',
    tags: ['Forensics', 'CFSL', 'ISO-27037', 'Digital-Evidence', 'Section-293-CrPC'],
  },
  {
    id: 'doc_crt_104',
    title: 'Judicial Search Warrant & Certificate Under Section 65B Indian Evidence Act',
    original_filename: 'Court_Order_65B_Certificate_CMM_PatialaHouse.pdf',
    mime_type: 'application/pdf',
    file_size: 786432,
    sha256_hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    encryption_algo: 'aes-256-gcm',
    case_id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    case_title: 'State (NCT of Delhi) v. Inter-State VAHAN RTO Syndicate & Cloned HSRP Network',
    department_id: 'dept_legal',
    department_name: 'Directorate of Prosecution & Judicial Liaison',
    owner_id: 'user_admin',
    owner_name: 'Dr. Vikramaditya Sen, IPS',
    sensitivity_level: 'CONFIDENTIAL',
    current_version: 1,
    status: 'ACTIVE',
    ai_classification: 'Court Order',
    ai_confidence: 0.98,
    ai_summary: 'Judicial Search Warrant granted under Section 93 CrPC (Sec 96 BNSS) by Chief Metropolitan Magistrate, Patiala House Courts Complex, New Delhi. Includes formal certificate under Section 65B(4) of Indian Evidence Act / Section 63 BSA attesting to integrity of cryptographic computer outputs.',
    aiEntities: [
      { type: 'COURT', value: 'Court of Chief Metropolitan Magistrate, Patiala House Courts, New Delhi' },
      { type: 'JUDGE', value: 'Hon. Sh. V. K. Deshmukh, DHJS' },
      { type: 'LEGAL_SECTION', value: 'Section 93 CrPC / Section 65B(4) Evidence Act' },
      { type: 'ADMISSIBILITY', value: 'Primary Electronic Admissibility Confirmed' },
    ],
    ocr_extracted_text: `IN THE COURT OF THE CHIEF METROPOLITAN MAGISTRATE
PATIALA HOUSE COURTS COMPLEX, NEW DELHI
CRIMINAL MISCELLANEOUS APPLICATION NO. 512/2024
IN FIR NO. 0412/2024 (P.S. CYBER CRIME, SECTOR 62)

State (NCT of Delhi) ... Prosecution
Versus
Rakesh Verma @ Apex Vector & Anr. ... Accused

ORDER UNDER SECTION 93 Cr.P.C. & ELECTRONIC CERTIFICATION
1. Application heard on behalf of the Special Public Prosecutor Advocate Meenakshi Sundaram.
2. The Court, having perused the Case Diary and the preliminary findings of CFSL CBI New Delhi, is satisfied that search and seizure was lawful and warranted.
3. CERTIFICATE UNDER SECTION 65B(4) INDIAN EVIDENCE ACT, 1872 (Section 63 BSA):
   The digital records, server logs, cryptographic hashes (SHA-256), and bit-stream images generated by the SecureVault system are certified to have been produced by computers during their ordinary lawful course of operational management. The integrity of the hash chain is verified without discrepancy.
4. The seized evidence items CFSL-2024-E412-A through E412-D are remanded to safe judicial custody.
Given under my hand and seal of the Court this 22nd day of August 2024.
(Sh. V. K. Deshmukh) Chief Metropolitan Magistrate, Patiala House Courts, New Delhi.`,
    is_tampered_demo: 0,
    created_at: '2024-08-22T11:00:00Z',
    updated_at: '2024-08-22T11:00:00Z',
    tags: ['Court-Order', 'Judicial', 'Section-65B', 'Section-93-CrPC', 'Patiala-House'],
    digitalSignature: {
      id: 'sig_104_crt',
      document_id: 'doc_crt_104',
      signer_id: 'user_admin',
      signer_name: 'Dr. Vikramaditya Sen, IPS',
      signed_hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      signature_hex: 'e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5061728394a5b6c7d8e9fa0b1c2d3e4f5',
      key_fingerprint: 'SHA256:8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
      algorithm: 'RSA-PSS-SHA256-4096',
      certificate_authority: 'SecureVault Root Authority (Govt. of India e-Sign PKI)',
      signed_at: '2024-08-22T11:15:00Z',
    },
  },
  {
    id: 'doc_grid_101',
    title: 'CERT-In SCADA Incident Response Forensic Report (CIAD-2024-0018)',
    original_filename: 'CERT-In_CIAD-2024-0018_SCADA_Triage.pdf',
    mime_type: 'application/pdf',
    file_size: 3145728,
    sha256_hash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    encryption_algo: 'aes-256-gcm',
    case_id: 'case_101',
    case_number: 'CASE-2024-CBI-101',
    case_title: 'CBI (STF) v. Power Grid SLDC SCADA Telemetry Exfiltration (Operation PowerShield)',
    department_id: 'dept_cyber',
    department_name: 'Central Cyber Crime Investigation Cell (C3IC)',
    owner_id: 'user_admin',
    owner_name: 'Dr. Vikramaditya Sen, IPS',
    sensitivity_level: 'TOP_SECRET',
    current_version: 1,
    status: 'ACTIVE',
    ai_classification: 'Forensic Report',
    ai_confidence: 0.99,
    ai_summary: 'Indian Computer Emergency Response Team (CERT-In) technical analysis of RedEcho SCADA malware reverse-engineered assembly hashes, C2 exfiltration beacons, and ICS gateway firewall packet captures.',
    aiEntities: [
      { type: 'INCIDENT_REF', value: 'CIAD-2024-0018' },
      { type: 'MALWARE_FAMILY', value: 'RedEcho APT / ShadowPad SCADA Dropper' },
      { type: 'CRITICAL_INFRA', value: 'State Load Despatch Center (SLDC)' },
      { type: 'LEGAL_SECTION', value: 'Section 66F IT Act (Cyber Terrorism)' },
    ],
    ocr_extracted_text: `INDIAN COMPUTER EMERGENCY RESPONSE TEAM (CERT-In)
MINISTRY OF ELECTRONICS AND INFORMATION TECHNOLOGY (MeitY)
Incident Advisory & Forensics: CIAD-2024-0018 | Security Classification: TOP SECRET
Subject: Targeted Intrusion into State Load Despatch Center (SLDC) Gateway Architecture

1. Executive Summary:
On 01-Aug-2024, telemetry monitoring at the National Grid Controller flagged anomalous outbound encrypted HTTPS beacons originating from human-machine interface (HMI) nodes at 66kV substation Alpha-9.
2. Malware Reverse Engineering:
The payload is identified as a tailored variant of the RedEcho ShadowPad backdoor, specifically compiled to hook proprietary Modbus and DNP3 industrial communication protocols.
3. Cryptographic Hashes:
Payload SHA-256: d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5
C2 IP Block: 198.51.100.44:8443 (Rerouted through multi-tier foreign VPS jump boxes).
4. Statutory Action: Transmitted to Central Cyber Crime Investigation Cell (C3IC) for prosecution under Section 66F of the Information Technology Act.`,
    is_tampered_demo: 0,
    created_at: '2024-08-02T16:00:00Z',
    updated_at: '2024-08-02T16:00:00Z',
    tags: ['CERT-In', 'SCADA', 'Top-Secret', 'Cyber-Terrorism', 'Case-101'],
  },
  {
    id: 'doc_eow_102',
    title: 'Forensic Financial Ledger: ₹62.4 Cr Hawala Trails & Bank Sec 65B Attestation',
    original_filename: 'EOW_Forensic_Audit_₹62.4Cr_Hawala.pdf',
    mime_type: 'application/pdf',
    file_size: 1572864,
    sha256_hash: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
    encryption_algo: 'aes-256-gcm',
    case_id: 'case_102',
    case_number: 'CASE-2024-EOW-102',
    case_title: 'State v. Apex Shell Corporate Invoicing & Hawala Remittance Syndicate',
    department_id: 'dept_eow',
    department_name: 'Economic Offences Wing & Financial Forensics',
    owner_id: 'user_inv_b',
    owner_name: 'DSP Rajesh Nair',
    sensitivity_level: 'CONFIDENTIAL',
    current_version: 1,
    status: 'ACTIVE',
    ai_classification: 'Investigation Report',
    ai_confidence: 0.97,
    ai_summary: 'Forensic CA audit report mapping ₹62.40 Crore circular invoicing across dummy diamond exporters and offshore shell companies, backed by State Bank of India SWIFT MT103 logs and Section 65B electronic certificates.',
    aiEntities: [
      { type: 'TOTAL_DEFALCATION', value: '₹62,40,00,000 (Sixty-Two Crore Forty Lakh)' },
      { type: 'SHELL_COMPANIES', value: '18 Dummy Entities (Mumbai, Surat, Dubai)' },
      { type: 'LEGAL_SECTION', value: 'PMLA Sec 3 & 4 / IPC Sec 409 & 420' },
    ],
    ocr_extracted_text: `ECONOMIC OFFENCES WING (EOW) | FINANCIAL CRIME INVESTIGATION
Case Reference: CASE-2024-EOW-102 | Crime No. 088/2024
Forensic Audit Report on Circular Invoicing & Foreign Exchange Routing

1. Target Entities: Apex Global Exim Pvt Ltd and 17 associated shell entities.
2. Defalcation Pattern: Systematic generation of fraudulent e-way bills without underlying physical movement of merchandise. Total bogus turnover: ₹62,40,00,000.
3. Bank Accounts Analyzed:
   - State Bank of India, Nariman Point Commercial Branch (Account No. 38910488219)
   - HDFC Bank, Bandra Kurla Complex (Account No. 50200084910211)
4. Certification:
   All transaction extractions verified under Section 65B of Indian Evidence Act by Authorized Bank Officers. Proceeds of crime attached under Section 5(1) Prevention of Money Laundering Act.
Submitted By: DSP Rajesh Nair, Economic Offences Wing.`,
    is_tampered_demo: 0,
    created_at: '2024-08-11T11:30:00Z',
    updated_at: '2024-08-11T11:30:00Z',
    tags: ['Financial-Fraud', 'EOW', 'PMLA', 'Hawala', 'Bank-Audit', 'Case-102'],
  },
];

export const MOCK_EVIDENCE: EvidenceRecord[] = [
  {
    id: 'ev_104_a',
    evidence_number: 'CFSL-2024-E412-A',
    title: 'SanDisk Extreme PRO 128GB MicroSDXC (Exhibit A)',
    description: 'Hardware memory module extracted from covert console of seized vehicle DL-01-AB-1234. Bit-stream disk image confirmed with zero hash drift.',
    case_id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    case_title: 'State (NCT of Delhi) v. Inter-State VAHAN RTO Syndicate & Cloned HSRP Network',
    document_id: 'doc_for_104',
    current_custodian_id: 'user_auditor',
    custodian_name: 'Dr. Ananya Mukherjee (CFSL CBI)',
    badge_number: 'CFSL-PSO-088',
    status: 'FORENSIC_ANALYSIS',
    storage_location: 'CFSL Vault A, Digital Evidence Locker #44',
    integrity_hash: '4f8b2c6d9e1a3f5b7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
    collected_at: '2024-08-16T04:15:00Z',
    created_at: '2024-08-16T04:15:00Z',
  },
  {
    id: 'ev_104_b',
    evidence_number: 'CFSL-2024-E412-B',
    title: '14 Counterfeit Embossed HSRP Aluminum Plates (Exhibits B1-B14)',
    description: 'Counterfeit high-security registration plates bearing cloned series (DL-01-AB-1234, MH-12-CD-5678) with forged hot-stamped Ashoka Chakra holograms.',
    case_id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    case_title: 'State (NCT of Delhi) v. Inter-State VAHAN RTO Syndicate & Cloned HSRP Network',
    document_id: 'doc_ev_104',
    current_custodian_id: 'user_inv_a',
    custodian_name: 'Inspector Preetom Saha',
    badge_number: 'SV-CYBER-704',
    status: 'IN_CUSTODY',
    storage_location: 'Police Station Malkhana (Evidence Room), Rack 12-B',
    integrity_hash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    collected_at: '2024-08-16T04:30:00Z',
    created_at: '2024-08-16T04:30:00Z',
  },
  {
    id: 'ev_104_c',
    evidence_number: 'CFSL-2024-E412-C',
    title: 'OnePlus 11 5G Smartphone (IMEI: 869402058192031)',
    description: 'Seized mobile device of suspect Rakesh Verma. Forensic physical dump extracted via Cellebrite UFED containing Matrix chat logs and cryptocurrency wallet seeds.',
    case_id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    case_title: 'State (NCT of Delhi) v. Inter-State VAHAN RTO Syndicate & Cloned HSRP Network',
    document_id: 'doc_for_104',
    current_custodian_id: 'user_inv_a',
    custodian_name: 'Inspector Preetom Saha',
    badge_number: 'SV-CYBER-704',
    status: 'IN_CUSTODY',
    storage_location: 'Malkhana Shielded Faraday Vault #2',
    integrity_hash: '9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e',
    collected_at: '2024-08-16T04:45:00Z',
    created_at: '2024-08-16T04:45:00Z',
  },
  {
    id: 'ev_104_d',
    evidence_number: 'CFSL-2024-E412-D',
    title: 'Evolis Primacy Industrial Smart Card Embosser & 200 RFID Chips',
    description: 'Industrial dye-sublimation hardware used to encode cloned Mifare 1K smart cards for fraudulent vehicle registration certificates.',
    case_id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    case_title: 'State (NCT of Delhi) v. Inter-State VAHAN RTO Syndicate & Cloned HSRP Network',
    document_id: 'doc_ev_104',
    current_custodian_id: 'user_inv_a',
    custodian_name: 'Inspector Preetom Saha',
    badge_number: 'SV-CYBER-704',
    status: 'IN_CUSTODY',
    storage_location: 'Malkhana Heavy Machinery Safe 01',
    integrity_hash: '3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a',
    collected_at: '2024-08-16T05:15:00Z',
    created_at: '2024-08-16T05:15:00Z',
  },
];

export const MOCK_CUSTODY_EVENTS: Record<string, CustodyEvent[]> = {
  ev_104_a: [
    {
      id: 'cust_104_1',
      evidence_id: 'ev_104_a',
      case_id: 'case_104',
      previous_custodian: 'Scene of Crime (Toyota Fortuner DL-01-AB-1234 Console)',
      new_custodian: 'Inspector Preetom Saha',
      action: 'COLLECTION_AND_SEAL',
      reason: 'Seizure under Section 100 CrPC Panchnama in presence of independent witnesses.',
      timestamp: '2024-08-16T04:15:00Z',
      performed_by_id: 'user_inv_a',
      performed_by_name: 'Inspector Preetom Saha',
      badge_number: 'SV-CYBER-704',
      integrity_hash: '4f8b2c6d9e1a3f5b7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
      signature_status: 'VERIFIED',
    },
    {
      id: 'cust_104_2',
      evidence_id: 'ev_104_a',
      case_id: 'case_104',
      previous_custodian: 'Inspector Preetom Saha',
      new_custodian: 'Dr. Ananya Mukherjee (CFSL CBI New Delhi)',
      action: 'FORENSIC_TRANSFER',
      reason: 'Dispatched via special messenger constable for bit-stream disk imaging and chip cryptanalysis under Section 293 CrPC.',
      timestamp: '2024-08-17T10:30:00Z',
      performed_by_id: 'user_admin',
      performed_by_name: 'Dr. Vikramaditya Sen, IPS',
      badge_number: 'IPS-2011-DL04',
      integrity_hash: '4f8b2c6d9e1a3f5b7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
      signature_status: 'VERIFIED',
    },
  ],
};

export const MOCK_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'audit_gen',
    user_id: 'SYSTEM',
    user_name: 'SecureVault Cryptographic Kernel',
    action: 'GENESIS_BLOCK_ANCHOR',
    details: 'Cryptographic root ledger anchored. Genesis SHA-256 state established for judiciary compliance.',
    ip_address: '127.0.0.1',
    timestamp: '2024-08-01T00:00:00Z',
    previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    current_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'audit_01',
    user_id: 'user_admin',
    user_name: 'Dr. Vikramaditya Sen, IPS',
    action: 'CASE_REGISTERED',
    resource_id: 'case_104',
    resource_type: 'CASE',
    case_id: 'case_104',
    details: 'CASE-2024-ND-412 (FIR 412/2024) instituted. Inspector Preetom Saha assigned as Lead Cyber Forensic Investigator.',
    ip_address: '10.14.8.12',
    timestamp: '2024-08-14T11:25:00Z',
    previous_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    current_hash: '8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
  },
  {
    id: 'audit_02',
    user_id: 'user_inv_a',
    user_name: 'Inspector Preetom Saha',
    action: 'DOCUMENT_UPLOADED',
    resource_id: 'doc_fir_104',
    resource_type: 'DOCUMENT',
    case_id: 'case_104',
    details: 'FIR 0412/2024 encrypted with AES-256-GCM envelope and anchored with SHA-256 fingerprint.',
    ip_address: '10.14.8.55',
    timestamp: '2024-08-14T12:00:00Z',
    previous_hash: '8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
    current_hash: '7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
  },
  {
    id: 'audit_03',
    user_id: 'user_admin',
    user_name: 'Dr. Vikramaditya Sen, IPS',
    action: 'DIGITAL_SIGNATURE_APPLIED',
    resource_id: 'doc_fir_104',
    resource_type: 'DOCUMENT',
    case_id: 'case_104',
    details: 'Applied asymmetric RSA-PSS-SHA256-4096 judicial attestation signature.',
    ip_address: '10.14.8.12',
    timestamp: '2024-08-14T12:05:00Z',
    previous_hash: '7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
    current_hash: '9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
  },
  {
    id: 'audit_04',
    user_id: 'user_inv_b',
    user_name: 'DSP Rajesh Nair',
    action: 'ACCESS_DENIED_UNAUTHORIZED',
    resource_id: 'doc_fir_104',
    resource_type: 'DOCUMENT',
    case_id: 'case_104',
    details: 'Unauthorized cross-case access blocked (HTTP 403): DSP Rajesh Nair is not assigned to CASE-2024-ND-412.',
    ip_address: '10.14.9.88',
    timestamp: '2024-08-15T14:22:00Z',
    previous_hash: '9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    current_hash: '1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
  },
];

export const MOCK_SECURITY_ALERTS: SecurityAlert[] = [
  {
    id: 'alert_01',
    alert_type: 'UNAUTHORIZED_CROSS_CASE_PROBING',
    severity: 'HIGH',
    user_id: 'user_inv_b',
    user_name: 'DSP Rajesh Nair',
    case_id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    description: 'Multiple unauthorized read attempts detected on Case 104 confidential evidence by unassigned officer DSP Rajesh Nair.',
    reasons: ['User does not possess active Case 104 clearance roster entry', 'BOLA / IDOR protection rule triggered on REST endpoint'],
    risk_score: 75,
    is_resolved: 0,
    created_at: '2024-08-15T14:25:00Z',
  },
  {
    id: 'alert_02',
    alert_type: 'BULK_DECRYPTION_VELOCITY',
    severity: 'MEDIUM',
    user_id: 'user_inv_a',
    user_name: 'Inspector Preetom Saha',
    case_id: 'case_104',
    case_number: 'CASE-2024-ND-412',
    description: 'Rapid sequential decryption of 4 confidential case documents within 45 seconds.',
    reasons: ['Exceeds standard human reading velocity baseline', 'Verified legitimate during Patiala House Court charge sheet preparation'],
    risk_score: 40,
    is_resolved: 1,
    created_at: '2024-08-18T10:12:00Z',
  },
];

export const MOCK_GRAPH_DATA: GraphData = {
  caseId: 'case_104',
  nodes: [
    {
      id: 'case_104',
      label: 'CASE-2024-ND-412 (VAHAN RTO Syndicate)',
      type: 'CASE',
      sensitivity: 'CONFIDENTIAL',
      details: {
        title: 'State (NCT of Delhi) v. Inter-State VAHAN RTO Syndicate & Cloned HSRP Network',
        firNumber: 'FIR No. 0412/2024 (P.S. Cyber Crime Sector 62)',
        leadInvestigator: 'Inspector Preetom Saha (Badge: SV-CYBER-704)',
        supervisingOfficer: 'Dr. Vikramaditya Sen, IPS (ADGP)',
        status: 'ACTIVE INVESTIGATION / CHARGE SHEET UNDER PREPARATION',
        jurisdiction: 'Court of Chief Metropolitan Magistrate, Patiala House Courts',
        applicableActs: 'BNS 318(4), 336(3), 340(2) | IPC 420, 468, 471 | IT Act 66C/66D',
      },
    },
    {
      id: 'doc_fir_104',
      label: 'FIR 0412/2024 (P.S. Cyber Crime)',
      type: 'DOCUMENT',
      sensitivity: 'CONFIDENTIAL',
      details: {
        documentTitle: 'First Information Report under Sec 154 CrPC (Sec 173 BNSS)',
        policeStation: 'Cyber Crime Police Station, Sector 62, Noida',
        complainant: 'Shri Rajesh Kumar, Inspector of Motor Vehicles (RTA)',
        filingDate: '14-Aug-2024 12:00 hrs',
        sha256Hash: '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b',
        courtAdmissibility: 'Primary Cognizable Offense Record',
      },
    },
    {
      id: 'doc_rep_104',
      label: 'Case Diary Vol. 1 (Sec 172 CrPC)',
      type: 'DOCUMENT',
      sensitivity: 'CONFIDENTIAL',
      details: {
        dossierType: 'Statutory Police Case Diary & Tower Triangulation',
        author: 'Inspector Preetom Saha, SDFW',
        seizureAmount: '₹48,50,000 Cash attached under Sec 102 CrPC',
        cdrEvidence: 'Tower Triangulation coordinates: 28.6280° N, 77.3649° E',
        tamperProofHash: '8f14e45fceea167a5a36dedd4bea2543add704e46bb25077273fc45ab6409ecf',
      },
    },
    {
      id: 'doc_for_104',
      label: 'CFSL Lab Report (CFSL-891)',
      type: 'DOCUMENT',
      sensitivity: 'SECRET',
      details: {
        institution: 'Central Forensic Science Laboratory (CFSL CBI New Delhi)',
        chiefExaminer: 'Dr. Ananya Mukherjee, Principal Scientific Officer',
        standard: 'ISO/IEC 27037:2012 Certified Forensics',
        methodology: 'Tableau T8u Hardware Write-Blocker Bit-Stream Dump (.E01)',
        findings: '342 cloned vehicle registration smart card templates & unencrypted Matrix chat logs recovered',
      },
    },
    {
      id: 'doc_crt_104',
      label: 'Court Warrant & Sec 65B Certificate',
      type: 'DOCUMENT',
      sensitivity: 'CONFIDENTIAL',
      details: {
        issuingCourt: 'Court of Chief Metropolitan Magistrate, Patiala House Courts, New Delhi',
        presidingJudge: 'Hon. Sh. V. K. Deshmukh, DHJS',
        ordersGranted: 'Search Warrant under Sec 93 CrPC & Section 65B(4) Evidence Act Certificate',
        status: 'Admitted as Primary Electronic Evidence',
      },
    },
    {
      id: 'ev_104_a',
      label: 'SanDisk MicroSD 128GB (CFSL-E412-A)',
      type: 'EVIDENCE',
      sensitivity: 'SECRET',
      details: {
        evidenceNumber: 'CFSL-2024-E412-A',
        storageLocker: 'CFSL Digital Evidence Vault A / Safe 04',
        custodyOfficer: 'Dr. Ananya Mukherjee (Principal Scientific Officer)',
        extractionStatus: 'Bit-Stream Raw Dump (.dd) & SHA-256 Anchored',
        provenance: 'Seized from covert dash console of Toyota Fortuner DL-01-AB-1234',
      },
    },
    {
      id: 'ev_104_b',
      label: '14 Counterfeit HSRP Plates (CFSL-E412-B)',
      type: 'EVIDENCE',
      sensitivity: 'CONFIDENTIAL',
      details: {
        evidenceNumber: 'CFSL-2024-E412-B',
        quantity: '14 Aluminum Units',
        physicalCondition: 'Laser-Etched Cloned Series with Fake Ashoka Chakra Holograms',
        custodyOfficer: 'Inspector Preetom Saha',
        storageLocation: 'Malkhana (Evidence Room) Rack 12-B',
      },
    },
    {
      id: 'ev_104_c',
      label: 'OnePlus 11 5G (CFSL-E412-C)',
      type: 'EVIDENCE',
      sensitivity: 'SECRET',
      details: {
        evidenceNumber: 'CFSL-2024-E412-C',
        imei: '869402058192031',
        deviceOwner: 'Rakesh Verma alias "Apex Vector"',
        forensicArtifacts: 'Extracted Matrix chats, crypto wallet addresses, GPS waypoint telemetry',
        storageLocation: 'Malkhana Shielded Faraday Vault #2',
      },
    },
    {
      id: 'ent_veh_1',
      label: 'Toyota Fortuner 4x4 (DL-01-AB-1234)',
      type: 'VEHICLE',
      details: {
        registrationMark: 'DL-01-AB-1234 (Counterfeit Duplicate Plate)',
        vehicleModel: 'Toyota Fortuner 2.8L 4x4 Diesel (Matte Black)',
        engineChassisNumber: 'Tampered & Re-engraved Chassis Markings',
        recoveryLocation: 'Sector 62 Underground Bay 4, Noida',
        status: 'Impounded under Section 102 CrPC in Police Compound',
      },
    },
    {
      id: 'ent_veh_2',
      label: 'Hyundai Creta 1.5 (MH-12-CD-5678)',
      type: 'VEHICLE',
      details: {
        registrationMark: 'MH-12-CD-5678 (Forged RTO Paperwork)',
        vehicleModel: 'Hyundai Creta 1.5 SX (Silver Metallic)',
        linkedSuspect: 'Vikram Solanki (Syndicate Courier)',
        trackingStatus: 'FASTag Interstate Toll Camera Detection',
        status: 'Seized at Western Peripheral Toll Plaza',
      },
    },
    {
      id: 'ent_sus_1',
      label: 'Rakesh Verma ("Apex Vector")',
      type: 'PERSON',
      details: {
        alias: 'Apex Vector / Rocky',
        role: 'Kingpin & Master Forger (Vehicle Registration Syndicate)',
        criminalHistory: 'History-sheeter in interstate vehicle smuggling & cyber identity cloning',
        warrantStatus: 'Remanded to Police Custody by Patiala House Court',
        charges: 'BNS Sec 318(4), 336(3), 340(2) & IT Act Sec 66C/66D',
      },
    },
    {
      id: 'ent_sus_2',
      label: 'Vikram Solanki (Ex-RTO Operator)',
      type: 'PERSON',
      details: {
        role: 'Rogue Portal Insider & Credential Leaker',
        formerDesignation: 'Contractual Data Entry Operator, Regional Transport Office',
        modusOperandi: 'Exfiltrated dealer OTP credentials and approved forged chassis entries',
        status: 'Arrested under Section 41A CrPC',
      },
    },
    {
      id: 'ent_loc_1',
      label: 'Sector 62 Underground Bay 4, Noida',
      type: 'LOCATION',
      details: {
        address: 'Basement Level 2, Commercial Bay 4, Sector 62, Noida (NCR)',
        coordinates: '28.6280° N, 77.3649° E',
        siteClassification: 'Clandestine Counterfeiting Workshop & Plate Stamping Unit',
        raidDate: '16-Aug-2024 at 03:30 hrs',
      },
    },
    {
      id: 'ent_org_1',
      label: 'State Transport Department (VAHAN 4.0)',
      type: 'ORGANIZATION',
      details: {
        system: 'National Parivahan / VAHAN 4.0 Centralized Portal',
        auditStatus: 'Internal Vulnerability Assessment & Credential Invalidation Enacted',
        remedy: 'Multi-Factor Hardware Token Authentication enforced for RTO dealer logins',
      },
    },
    {
      id: 'ent_org_2',
      label: 'Central Forensic Science Lab (CFSL CBI)',
      type: 'ORGANIZATION',
      details: {
        agency: 'CFSL CBI New Delhi (Ministry of Home Affairs)',
        role: 'Accredited Statutory Forensic Examination & Digital Evidence Integrity Prover',
        signatory: 'Dr. Ananya Mukherjee, Principal Scientific Officer',
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'case_104', target: 'doc_fir_104', label: 'CONTAINS' },
    { id: 'e2', source: 'case_104', target: 'doc_rep_104', label: 'CONTAINS' },
    { id: 'e3', source: 'case_104', target: 'doc_for_104', label: 'CONTAINS' },
    { id: 'e4', source: 'case_104', target: 'doc_crt_104', label: 'CONTAINS' },
    { id: 'e5', source: 'case_104', target: 'ev_104_a', label: 'HAS_EVIDENCE' },
    { id: 'e6', source: 'case_104', target: 'ev_104_b', label: 'HAS_EVIDENCE' },
    { id: 'e7', source: 'case_104', target: 'ev_104_c', label: 'HAS_EVIDENCE' },
    { id: 'e8', source: 'doc_fir_104', target: 'ent_veh_1', label: 'IDENTIFIES' },
    { id: 'e9', source: 'doc_fir_104', target: 'ent_veh_2', label: 'IDENTIFIES' },
    { id: 'e10', source: 'doc_rep_104', target: 'ent_sus_1', label: 'SUSPECT_NAMED' },
    { id: 'e11', source: 'doc_rep_104', target: 'ent_sus_2', label: 'INSIDER_NAMED' },
    { id: 'e12', source: 'doc_rep_104', target: 'ent_loc_1', label: 'SCENE_OF_CRIME' },
    { id: 'e13', source: 'ev_104_a', target: 'ent_veh_1', label: 'RECOVERED_FROM' },
    { id: 'e14', source: 'doc_for_104', target: 'ev_104_a', label: 'ANALYZES' },
    { id: 'e15', source: 'doc_for_104', target: 'ent_org_2', label: 'ISSUED_BY' },
    { id: 'e16', source: 'ent_sus_2', target: 'ent_org_1', label: 'COMPROMISED' },
  ],
  stats: {
    totalNodes: 15,
    totalEdges: 16,
    casesCount: 1,
  },
};
