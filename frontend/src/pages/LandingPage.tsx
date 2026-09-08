import React from 'react';
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
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
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

      {/* Problem Statement & Architectural Alignment */}
      <section className="py-20 px-6 md:px-12 bg-slate-950/90 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Problem Statement Callout Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900 border border-cyan-500/40 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4 mb-4">
              <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Scale className="w-4 h-4" />
                <span>Smart India Hackathon (SIH) • Official Problem Statement</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold self-start md:self-auto">
                DOMAIN: LEGAL & FORENSIC CYBERSECURITY
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
                &ldquo;Poor auditability and compliance tracking. As the volume of legal and investigation-related data continues to grow, there is an increasing need for a secure, centralized, and intelligent document management system that ensures data integrity, accessibility, confidentiality, and efficient case management. Modern technologies such as Cloud Computing, Artificial Intelligence (AI), Blockchain, Digital Signatures, and Secure Access Control can significantly improve the management and security of legal and investigative documents.&rdquo;
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                SECUREVAULT is purposefully architected as the reference implementation addressing every dimension of this mandate.
              </p>
            </div>
          </div>

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

          {/* 4 Fundamental Problem Requirements Solved */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-6">
            <div className="space-y-6">
              <div className="text-xs font-mono text-rose-400 uppercase tracking-widest font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>The Core Deficiencies Solved</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Why Conventional File Systems Fail Legal & Police Scrutiny</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ordinary cloud drives and email portals lack cryptographic chains of custody, store unencrypted files vulnerable to rogue insiders, suffer from broken object authorization (BOLA/IDOR), and leave no verifiable mathematical proof for courtroom prosecution.
              </p>
              <div className="space-y-2.5 font-mono text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Poor auditability & non-verifiable logs easily contested in court</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Silent bitrot or deliberate record modification undetected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Accidental cross-department leakage of confidential investigation files</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0e1629] to-[#0a0f1d] border border-cyan-500/30 shadow-2xl space-y-4">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>The 4 Core Guarantees of SecureVault</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-cyan-400 font-bold font-mono">1. Data Integrity</div>
                  <div className="text-slate-300 text-[11px]">AES-256-GCM auth tags + SHA-256 fingerprinting + tamper lab.</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-blue-400 font-bold font-mono">2. Accessibility & Cases</div>
                  <div className="text-slate-300 text-[11px]">Centralized case dossiers, evidence custody, & entity graphs.</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-amber-400 font-bold font-mono">3. Compliance & Audits</div>
                  <div className="text-slate-300 text-[11px]">Immutable Genesis-anchored blockchain-style audit ledger.</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold font-mono">4. Confidentiality</div>
                  <div className="text-slate-300 text-[11px]">Fine-grained ABAC + dynamic watermarking + 2FA security.</div>
                </div>
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
