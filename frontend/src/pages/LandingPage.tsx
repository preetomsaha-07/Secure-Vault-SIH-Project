import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  FileText,
  Layers,
  Network,
  Cpu,
  History,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Fingerprint,
  Cloud,
  Database,
  Scale,
  Search,
  Users,
  FileCheck,
  ShieldAlert,
  Clock,
  Check,
  BookOpen,
  ListChecks,
  Activity,
  FileCode,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [activeDossierTab, setActiveDossierTab] = useState<
    'statement' | 'challenges' | 'mandates' | 'lifecycle'
  >('statement');
  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-slate-800/80 bg-[#0a0f1d]/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider text-white">SECURE<span className="text-cyan-400">VAULT</span></span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              Prototype
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onEnterApp}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/25 flex items-center space-x-2 transition"
          >
            <span>Access SecureVault</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 md:px-12 max-w-7xl mx-auto text-center overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Generation Digital Forensics & Legal Evidence Ecosystem</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight md:leading-tight">
          Secure Digital Vault for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Legal Records</span> & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Digital Evidence</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Protect sensitive documents with AES-256-GCM encryption, case-aware access control, tamper-evident audit trails, digital signatures, AI-powered retrieval, and verifiable chain of custody workflows.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-cyan-500/30 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
          >
            <ShieldCheck className="w-5 h-5 text-slate-950" />
            <span>Launch SecureVault Prototype</span>
          </button>
        </div>

        {/* Core Principles Strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-6 gap-3 max-w-5xl mx-auto text-xs font-mono font-semibold">
          {[
            { label: 'CONFIDENTIALITY', desc: 'AES-256-GCM Authenticated' },
            { label: 'INTEGRITY', desc: 'SHA-256 Fingerprinting' },
            { label: 'AVAILABILITY', desc: 'High-Resilience Storage' },
            { label: 'ACCOUNTABILITY', desc: 'Tamper-Evident Ledger' },
            { label: 'TRACEABILITY', desc: 'Chain of Custody' },
            { label: 'INTELLIGENCE', desc: 'Privacy-Preserving AI' },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-cyan-400 font-bold">{item.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Complete Problem Statement & Architectural Alignment Dossier */}
      <section className="py-20 px-6 md:px-12 bg-slate-950/95 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Scale className="w-4 h-4" />
                <span>Smart India Hackathon (SIH) • Official Problem Statement Dossier</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
                Secure Digital Document Management System (DMS)
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                National Security, Legal Governance & Police Asset Lifecycle Management
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold self-start md:self-auto flex items-center space-x-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Problem Specification Aligned</span>
            </span>
          </div>

          {/* Interactive Dossier Navigation Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 p-1.5 bg-[#0e1629] border border-slate-800 rounded-2xl gap-1 font-mono text-xs">
            <button
              onClick={() => setActiveDossierTab('statement')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition ${
                activeDossierTab === 'statement'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Official Statement</span>
            </button>

            <button
              onClick={() => setActiveDossierTab('challenges')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition ${
                activeDossierTab === 'challenges'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>2. Scope & Challenges</span>
            </button>

            <button
              onClick={() => setActiveDossierTab('mandates')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition ${
                activeDossierTab === 'mandates'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>3. 7 System Mandates</span>
            </button>

            <button
              onClick={() => setActiveDossierTab('lifecycle')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition ${
                activeDossierTab === 'lifecycle'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>4. Police Asset Lifecycle</span>
            </button>
          </div>

          {/* TAB 1: COMPLETE OFFICIAL PROBLEM STATEMENT (VERBATIM) */}
          {activeDossierTab === 'statement' && (
            <div className="p-8 rounded-3xl bg-[#0e1629] border border-cyan-500/30 shadow-2xl space-y-6 animate-in fade-in">
              <div className="space-y-4">
                {/* Background Sub-Section */}
                <div className="space-y-2 border-b border-slate-800 pb-5">
                  <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>• Background</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    Law enforcement agencies, courts, legal departments, and investigative organizations handle vast amounts of sensitive documents throughout the lifecycle of a case. These documents may include:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs text-cyan-300">
                    <span className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">✓ FIRs & police reports</span>
                    <span className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">✓ Investigation records</span>
                    <span className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">✓ Witness statements</span>
                    <span className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">✓ Charge sheets</span>
                    <span className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">✓ Court filings</span>
                    <span className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">✓ Evidence records</span>
                    <span className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">✓ Forensic reports</span>
                    <span className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">✓ Legal notices & judgments</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed pt-2">
                    Many organizations still rely on paper-based systems or fragmented digital storage solutions. This often leads to challenges such as:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-rose-300 font-mono pt-1">
                    <span>• Difficulty in locating documents quickly</span>
                    <span>• Unauthorized access to confidential information</span>
                    <span>• Document tampering risks</span>
                    <span>• Lack of version control</span>
                    <span>• Inefficient collaboration between departments</span>
                    <span>• Delays in legal and investigative processes</span>
                    <span className="sm:col-span-2 font-bold text-amber-300">• Poor auditability and compliance tracking</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    As the volume of legal and investigation-related data continues to grow, there is an increasing need for a secure, centralized, and intelligent document management system that ensures data integrity, accessibility, confidentiality, and efficient case management. Modern technologies such as Cloud Computing, Artificial Intelligence (AI), Blockchain, Digital Signatures, and Secure Access Control can significantly improve the management and security of legal and investigative documents.
                  </p>
                </div>

                {/* Description Sub-Section */}
                <div className="space-y-2 border-b border-slate-800 pb-5">
                  <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>• Description</span>
                  </div>
                  <p className="text-sm text-white font-medium leading-relaxed">
                    The objective is to develop a Secure Digital Document Management System (DMS) that enables law enforcement agencies, legal institutions, and investigative departments to securely store, organize, manage, retrieve, and share sensitive legal and investigation documents.
                  </p>
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1 text-xs text-slate-300 font-mono">
                    <div className="text-cyan-400 font-bold mb-1">The system should:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <div>✓ Digitize and centralize document storage.</div>
                      <div>✓ Ensure secure access and confidentiality.</div>
                      <div>✓ Prevent unauthorized modifications.</div>
                      <div>✓ Maintain a complete audit trail of document activities.</div>
                      <div>✓ Enable efficient document search and retrieval.</div>
                      <div>✓ Support collaboration among authorized stakeholders.</div>
                      <div className="sm:col-span-2">✓ Ensure compliance with legal and regulatory requirements.</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 italic pt-1">
                    The challenge is to create a secure, scalable, and intelligent platform that streamlines document handling while preserving legal validity and evidentiary integrity.
                  </p>
                </div>

                {/* Expected Solution Sub-Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>• Expected Solution</span>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-sm text-emerald-200 font-medium">
                    &ldquo;Develop a system to monitor and manage police assets throughout their lifecycle.&rdquo;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENT SCOPE & 7 LEGACY CHALLENGES RESOLVED */}
          {activeDossierTab === 'challenges' && (
            <div className="space-y-6 animate-in fade-in">
              {/* 8 Document Categories */}
              <div>
                <h3 className="text-sm font-mono text-cyan-400 uppercase font-bold mb-3 flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>8 Sensitive Case Lifecycle Documents Handled & Sealed</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { title: 'FIRs & Police Reports', desc: 'Initial incident report with cryptographic timestamp seal' },
                    { title: 'Investigation Records', desc: 'Detective field notes, interrogations, and suspect dossiers' },
                    { title: 'Witness Statements', desc: 'Signed evidentiary statements protected from repudiation' },
                    { title: 'Charge Sheets', desc: 'Formal statutory prosecution charges under procedural laws' },
                    { title: 'Court Filings', desc: 'Affidavits, judicial petitions, and bail hearings records' },
                    { title: 'Evidence Records', desc: 'Physical & digital evidence logs, extraction dumps' },
                    { title: 'Forensic Reports', desc: 'Cyber forensics, ballistics, CDRs, and malware analysis' },
                    { title: 'Judgments & Notices', desc: 'Judicial orders, summons, and courtroom decrees' },
                  ].map((doc, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#0e1629] border border-slate-800 space-y-1">
                      <div className="text-cyan-400 font-bold">{doc.title}</div>
                      <div className="text-[10px] text-slate-400">{doc.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7 Legacy Deficiencies vs SecureVault Resolutions */}
              <div>
                <h3 className="text-sm font-mono text-rose-400 uppercase font-bold mb-3 flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>7 Legacy Failure Points vs SecureVault Solutions</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {[
                    {
                      flaw: 'Difficulty in locating documents quickly',
                      solution: 'Privacy-preserving local AI OCR + NLP semantic query search engine',
                    },
                    {
                      flaw: 'Unauthorized access to confidential data',
                      solution: 'Fine-grained ABAC + 2FA OTP + Admin commission clearance approval',
                    },
                    {
                      flaw: 'Document tampering risks & bitrot',
                      solution: 'AES-256-GCM 128-bit auth tags + SHA-256 fingerprinting + tamper lab',
                    },
                    {
                      flaw: 'Lack of version control & integrity proof',
                      solution: 'Immutable cryptographic custody event records & non-destructive watermarking',
                    },
                    {
                      flaw: 'Inefficient collaboration between departments',
                      solution: 'Compartmentalized multi-tenant divisions (Cyber, Anti-Cartel, EOW, Legal)',
                    },
                    {
                      flaw: 'Delays in legal & investigative processes',
                      solution: 'Centralized case dossiers, auto-summarization & entity relationship graph',
                    },
                    {
                      flaw: 'Poor auditability & compliance tracking',
                      solution: 'Genesis-anchored SHA-256 hash-chained immutable audit ledger ($0^{64}$)',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#0e1629] border border-slate-800 space-y-1.5">
                      <div className="text-rose-400 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span className="font-bold">{item.flaw}</span>
                      </div>
                      <div className="text-emerald-400 flex items-center space-x-1.5 pl-3">
                        <span>↳</span>
                        <span className="text-[11px] text-slate-300 font-sans">{item.solution}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 7 CORE SYSTEM MANDATES */}
          {activeDossierTab === 'mandates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
              {[
                {
                  id: '01',
                  mandate: 'Digitize & Centralize Storage',
                  impl: 'Centralized encrypted object repository supporting PDF, DOCX, and forensic files with magic-byte validation and SHA-256 hashing on ingest.',
                  badge: 'Cloud & Ingest Verified',
                },
                {
                  id: '02',
                  mandate: 'Secure Access & Confidentiality',
                  impl: 'Multi-layer ABAC clearance levels (TOP_SECRET, SECRET, CONFIDENTIAL, UNRESTRICTED) + Non-destructive dynamic watermarking on export.',
                  badge: 'ABAC Clearance Active',
                },
                {
                  id: '03',
                  mandate: 'Prevent Unauthorized Modifications',
                  impl: 'AES-256-GCM envelope encryption with 128-bit authentication tag. Single-bit tampering triggers immediate cryptographic rejection.',
                  badge: 'GCM Authenticated',
                },
                {
                  id: '04',
                  mandate: 'Maintain Complete Audit Trail',
                  impl: 'Genesis-anchored SHA-256 hash-chained immutable ledger. Mathematically proves non-repudiation and court admissibility.',
                  badge: 'Chained Ledger Intact',
                },
                {
                  id: '05',
                  mandate: 'Efficient Search & Retrieval',
                  impl: 'Client-side OCR indexing, sensitive entity extraction (vehicles, IPC sections, PII), and natural language semantic smart query console.',
                  badge: 'AI OCR & NLP Active',
                },
                {
                  id: '06',
                  mandate: 'Support Authorized Collaboration',
                  impl: 'Secure JIT temporary sharing links with 192-bit entropy, bcrypt password protection, access limits, and auto-expiration.',
                  badge: 'JIT Sharing Ready',
                },
                {
                  id: '07',
                  mandate: 'Ensure Legal & Regulatory Compliance',
                  impl: 'PKI RSA-PSS 2048-bit asymmetric digital signatures and zero-leakage public QR verification for judicial review without data exposure.',
                  badge: 'Courtroom QR Validated',
                },
              ].map((m) => (
                <div key={m.id} className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-mono font-bold text-xs">{m.id}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>{m.badge}</span>
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{m.mandate}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{m.impl}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: POLICE ASSET & DIGITAL EVIDENCE LIFECYCLE */}
          {activeDossierTab === 'lifecycle' && (
            <div className="p-8 rounded-3xl bg-[#0e1629] border border-cyan-500/30 space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>Expected Solution • Police Asset Lifecycle Monitoring</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  End-to-End Custody, Management & Verification Timeline
                </h3>
                <p className="text-xs text-slate-400">
                  Every legal record and digital evidence asset is monitored through every operational phase from seizure to judicial ruling.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {[
                  {
                    step: 'Phase 1: Seizure & Ingest',
                    desc: 'Initial intake of police asset/evidence, magic-byte inspection, SHA-256 fingerprinting, and Genesis custody block generation.',
                    color: 'text-cyan-400 border-cyan-500/30',
                  },
                  {
                    step: 'Phase 2: Forensic Analysis',
                    desc: 'Transfer to Special Digital Forensics Wing (SDFW), local AI OCR extraction, sensitive entity detection, and classification.',
                    color: 'text-blue-400 border-blue-500/30',
                  },
                  {
                    step: 'Phase 3: Cryptographic Sealing',
                    desc: 'Envelope AES-256-GCM encryption with per-document subkeys derived via HKDF; stored in private object storage.',
                    color: 'text-purple-400 border-purple-500/30',
                  },
                  {
                    step: 'Phase 4: Case Collaboration',
                    desc: 'Multi-departmental access under strict ABAC clearance. Cross-investigator isolation enforced with BOLA/IDOR monitoring.',
                    color: 'text-amber-400 border-amber-500/30',
                  },
                  {
                    step: 'Phase 5: Digital Signature & Court Submission',
                    desc: '2048-bit RSA-PSS asymmetric digital signature applied. Public QR verification generated for judicial magistrate inspection.',
                    color: 'text-emerald-400 border-emerald-500/30',
                  },
                  {
                    step: 'Phase 6: Immutable Archival',
                    desc: 'Court-admissible custody chain finalized in immutable ledger ($0^{64}$), compliant with Section 65B Indian Evidence Act / BSA.',
                    color: 'text-rose-400 border-rose-500/30',
                  },
                ].map((phase, idx) => (
                  <div key={idx} className={`p-4 rounded-xl bg-slate-950/80 border ${phase.color} space-y-1.5`}>
                    <div className="font-bold text-xs font-mono text-white">{phase.step}</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{phase.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5-Pillar Modern Technology Matrix */}
          <div>
            <div className="text-center mb-8">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">Technology Convergence</div>
              <h3 className="text-2xl font-extrabold text-white mt-1">The 5 Core Technological Pillars of SecureVault</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Cloud className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">1. Cloud Computing</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Centralized, secure private object storage repository with departmental compartmentalization (Cyber Crime, EOW, Prosecution) and scalable serverless APIs.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">2. Artificial Intelligence (AI)</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Privacy-preserving local OCR (Tesseract.js), automated 10-category document classification, forensic entity extraction (vehicle plates, IPC sections), and NLP smart search.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">3. Blockchain Ledger</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Genesis-anchored SHA-256 hash-chained immutable audit ledger solving poor auditability. Instant mathematical non-repudiation and court-admissible audit logs.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">4. Digital Signatures</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  PKI RSA-PSS 2048-bit asymmetric cryptographic signatures over document digests. Zero-leakage public QR verification for judicial officers without exposing classified text.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">5. Secure Access Control</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Multi-layered ABAC (Role + Department + Case + Sensitivity Level), 2FA OTP verification, and mandatory Administrator commission clearance approval for new officers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Key Architectural Capabilities */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">Comprehensive Capabilities</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">Engineered for Critical Evidence Security</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Lock,
              title: 'AES-256-GCM Envelope Encryption',
              desc: 'Authenticated cipher utilizing unique per-document keys derived via HKDF. Tampering with any byte causes immediate authentication tag rejection.',
            },
            {
              icon: History,
              title: 'Tamper-Evident Audit Chain',
              desc: 'Block-by-block cryptographic chaining where each audit log cryptographically depends on the previous record hash back to the Genesis block.',
            },
            {
              icon: Layers,
              title: 'Digital Evidence Chain of Custody',
              desc: 'Verifiable physical and digital evidence transfer timeline tracking collectors, forensics analysts, legal counsel, and judicial submissions.',
            },
            {
              icon: Fingerprint,
              title: 'Digital Signatures (PKI / RSA-PSS)',
              desc: 'Asymmetric signing of document fingerprints ensuring non-repudiation, tamper detection after signing, and public QR verification.',
            },
            {
              icon: Network,
              title: 'Investigation Relationship Graph',
              desc: 'Interactive entity-relationship network connecting Cases, Persons, Vehicles, Locations, and Evidence with strict clearance filtering.',
            },
            {
              icon: Cpu,
              title: 'Privacy-Preserving Local AI & OCR',
              desc: 'Local Tesseract OCR, automated category classification, PII/vehicle entity detection, and summarization without exposing records to public cloud APIs.',
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800/80 bg-slate-950 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-center space-x-2 text-white font-bold tracking-wider">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>SECUREVAULT Prototype</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Secure Digital Document & Investigation Evidence Management Platform. Built for high-integrity legal records, investigative documents, and digital evidence.
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            Demo Environment: Fictional data only. Not affiliated with any official government entity.
          </p>
        </div>
      </footer>
    </div>
  );
};
