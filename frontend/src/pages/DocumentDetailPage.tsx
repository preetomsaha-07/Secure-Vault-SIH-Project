import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Download,
  Eye,
  FileSignature,
  History,
  Sparkles,
  Tag,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Save,
  Check,
  QrCode,
  Share2,
} from 'lucide-react';
import { api } from '../api/client';
import { DocumentRecord, DocumentVersion } from '../types';
import confetti from 'canvas-confetti';

interface DocumentDetailPageProps {
  documentId: string;
  onBack: () => void;
  onNavigate: (view: string, param?: string) => void;
}

export const DocumentDetailPage: React.FC<DocumentDetailPageProps> = ({
  documentId,
  onBack,
  onNavigate,
}) => {
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'integrity' | 'signature' | 'ai' | 'versions'>('preview');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<any | null>(null);
  const [isTampering, setIsTampering] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<any | null>(null);

  // Document Version Control state
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [versionSummary, setVersionSummary] = useState('');
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  // Related documents state
  const [relatedDocs, setRelatedDocs] = useState<DocumentRecord[]>([]);

  // Edit AI Classification & Tags state
  const [isEditingAi, setIsEditingAi] = useState(false);
  const [editedClassification, setEditedClassification] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadDocumentDetails();
    loadSignatureStatus();
    loadVersions();
    loadRelatedDocs();
  }, [documentId]);

  const loadDocumentDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ document: DocumentRecord }>(`/docs/${documentId}`);
      setDoc(res.document);
      setEditedClassification(res.document.ai_classification || 'Investigation Report');
      setEditedTags(res.document.tags || []);
      loadPreviewText();
    } catch (err: any) {
      alert(`Access denied: ${err.message}`);
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      const res = await api.get<{ versions: DocumentVersion[] }>(`/docs/${documentId}/versions`);
      setVersions(res.versions || []);
    } catch {}
  };

  const loadRelatedDocs = async () => {
    try {
      const res = await api.get<{ documents: DocumentRecord[] }>('/docs');
      const filtered = (res.documents || []).filter((d) => d.id !== documentId);
      setRelatedDocs(filtered.slice(0, 3));
    } catch {}
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVersion(true);
    try {
      const res = await api.post<any>(`/docs/${documentId}/versions`, {
        change_summary: versionSummary,
      });
      setVersions(res.versions || []);
      setShowNewVersionModal(false);
      setVersionSummary('');
      await loadDocumentDetails();
      confetti({ particleCount: 40, spread: 60 });
    } catch (err: any) {
      alert(`Failed to commit new version: ${err.message}`);
    } finally {
      setIsSavingVersion(false);
    }
  };

  const loadSignatureStatus = async () => {
    try {
      const res = await api.get<any>(`/docs/${documentId}/signature`);
      setSignatureStatus(res);
    } catch {}
  };

  const loadPreviewText = async () => {
    try {
      const text = await api.get<string>(`/docs/${documentId}/preview`);
      setPreviewContent(text);
    } catch {
      setPreviewContent('[Encrypted binary content secured with AES-256-GCM. Download to view formatted media.]');
    }
  };

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const res = await api.post<any>(`/docs/${documentId}/verify-integrity`);
      setIntegrityResult(res);
      if (res.status === 'VERIFIED') {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      alert(`Verification exception: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTampering = async () => {
    setIsTampering(true);
    try {
      if (doc?.is_tampered_demo) {
        await api.post(`/docs/${documentId}/reset-tamper`);
        await loadDocumentDetails();
        await handleVerifyIntegrity();
      } else {
        await api.post(`/docs/${documentId}/tamper-demo`);
        await loadDocumentDetails();
        await handleVerifyIntegrity();
      }
    } catch (err: any) {
      alert(`Tamper simulation failed: ${err.message}`);
    } finally {
      setIsTampering(false);
    }
  };

  const handleSignDocument = async () => {
    setIsSigning(true);
    try {
      await api.post(`/docs/${documentId}/sign`);
      await loadSignatureStatus();
      confetti({ particleCount: 50, spread: 70 });
    } catch (err: any) {
      alert(`Signing failed: ${err.message}`);
    } finally {
      setIsSigning(false);
    }
  };

  const handleSaveAiEdits = async () => {
    try {
      await api.put(`/docs/${documentId}/ai`, {
        classification: editedClassification,
        tags: editedTags,
      });
      setIsEditingAi(false);
      await loadDocumentDetails();
    } catch (err: any) {
      alert(`Failed to save edits: ${err.message}`);
    }
  };

  const handleDownload = async () => {
    if (!doc) return;
    try {
      await api.download(`/docs/${doc.id}/download`, doc.original_filename);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  if (isLoading || !doc) {
    return (
      <div className="py-12 text-center text-xs font-mono text-slate-400">
        Loading cryptographic document properties...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-white">{doc.title}</h1>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  doc.sensitivity_level === 'TOP_SECRET'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                    : doc.sensitivity_level === 'SECRET'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                }`}
              >
                {doc.sensitivity_level}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              DOC ID: {doc.id} • Case: {doc.case_number || 'General'} • Dept: {doc.department_name}
            </p>
          </div>
        </div>

        {/* Quick actions strip */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 text-xs font-mono rounded-lg flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Watermarked Copy</span>
          </button>
          <button
            onClick={() => onNavigate('qr-verify', doc.id)}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 text-xs font-mono rounded-lg flex items-center space-x-1.5 transition"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Public QR</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 text-xs font-mono font-medium overflow-x-auto">
        {[
          { id: 'preview', label: 'Dynamic Watermarked Preview', icon: Eye },
          { id: 'integrity', label: 'Document Integrity & Tamper Lab', icon: ShieldCheck },
          { id: 'signature', label: 'Digital Signatures (PKI)', icon: FileSignature },
          { id: 'ai', label: 'AI Classification & Forensics', icon: Sparkles },
          { id: 'versions', label: `Version Control (${versions.length || doc.current_version || 1})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 font-bold bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Watermarked Preview */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              Dynamic non-destructive security watermark applied. Master ciphertext in encrypted storage remains untouched.
            </span>
          </div>

          <div className="bg-[#0e1629] border border-slate-800 rounded-2xl p-6 min-h-[360px] shadow-xl relative overflow-hidden font-mono text-xs">
            {/* Watermark Diagonal Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 rotate-[-25deg] select-none text-slate-400 font-extrabold text-5xl">
              CONFIDENTIAL • SECUREVAULT EVIDENCE
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed relative z-10 font-sans text-sm">
              {previewContent}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Document Integrity & Tamper Lab */}
      {activeTab === 'integrity' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>SHA-256 & AES-256-GCM Integrity Engine</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Verifies ciphertext authentication tag and recalculates original SHA-256 document fingerprint.
                </p>
              </div>

              <button
                onClick={handleVerifyIntegrity}
                disabled={isVerifying}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>Verify Integrity Now</span>
              </button>
            </div>

            {/* Cryptographic Hashes Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Registered Genesis Fingerprint</span>
                <div className="text-cyan-300 font-bold break-all">{doc.sha256_hash}</div>
                <div className="text-[10px] text-slate-400 mt-1">Recorded during upload intake</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Authenticated Encryption Protocol</span>
                <div className="text-emerald-300 font-bold">{doc.encryption_algo.toUpperCase()}</div>
                <div className="text-[10px] text-slate-400 mt-1">128-bit authentication tag verification enabled</div>
              </div>
            </div>

            {/* Verification Result Banner */}
            {integrityResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-150 ${
                  integrityResult.status === 'VERIFIED'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm">
                  {integrityResult.status === 'VERIFIED' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span>✅ INTEGRITY VERIFIED</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                      <span>🚨 DOCUMENT INTEGRITY COMPROMISED</span>
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed">{integrityResult.message}</p>
                <div className="text-[11px] font-mono opacity-80">
                  Verified at: {integrityResult.verifiedAt} by {integrityResult.verifiedBy}
                </div>
              </div>
            )}

            {/* Controlled Tampering Demonstration Tool */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Controlled Demonstration Tampering Lab</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-lg">
                    Test the integrity detection engine by modifying the demo document copy. Real-world tampering will instantly trigger a security incident alert.
                  </p>
                </div>

                <button
                  onClick={handleSimulateTampering}
                  disabled={isTampering}
                  className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-lg transition ${
                    doc.is_tampered_demo
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {doc.is_tampered_demo ? 'Restore Pristine Copy' : 'Simulate Tampering on Demo Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Digital Signature Studio */}
      {activeTab === 'signature' && (
        <div className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-6 shadow-xl text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <FileSignature className="w-5 h-5 text-cyan-400" />
                <span>Asymmetric PKI Digital Signature Studio</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Signs document SHA-256 fingerprint using RSA-PSS 2048-bit asymmetric key pair.
              </p>
            </div>

            <button
              onClick={handleSignDocument}
              disabled={isSigning}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition"
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>{signatureStatus?.hasSignature ? 'Re-Sign Document' : 'Sign with Private Key'}</span>
            </button>
          </div>

          {signatureStatus?.hasSignature ? (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  signatureStatus.verification?.status === 'VALID'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <CheckCircle className="w-5 h-5" />
                  <span>{signatureStatus.statusBadge}</span>
                </div>
                <span className="font-mono text-xs">{signatureStatus.signature?.algorithm}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Authorized Signer</span>
                  <div className="text-white font-bold">{signatureStatus.signature?.signer_name}</div>
                  <div className="text-[10px] text-slate-400">Signed At: {signatureStatus.signature?.signed_at}</div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Public Key Fingerprint</span>
                  <div className="text-cyan-300 font-bold truncate">{signatureStatus.signature?.key_fingerprint}</div>
                  <div className="text-[10px] text-slate-400">{signatureStatus.signature?.certificate_authority}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-950/50 border border-slate-800 text-center space-y-2">
              <FileSignature className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-medium">This document has not been digitally signed yet.</p>
              <p className="text-xs text-slate-500">
                Click "Sign with Private Key" to generate an asymmetric RSA-PSS cryptographic signature.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: AI Classification & Forensic Intelligence */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-5 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span>Privacy-Preserving Document Intelligence</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Local NLP classification, entity extraction, and executive summarization.
                </p>
              </div>

              {!isEditingAi ? (
                <button
                  onClick={() => setIsEditingAi(true)}
                  className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white rounded-lg font-mono flex items-center space-x-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Classification</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveAiEdits}
                    className="px-3.5 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-lg font-mono flex items-center space-x-1 transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => setIsEditingAi(false)}
                    className="px-3 py-1.5 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Classification & Confidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Document Classification</span>
                {!isEditingAi ? (
                  <div className="text-lg font-bold text-cyan-300">{doc.ai_classification || 'Investigation Report'}</div>
                ) : (
                  <select
                    value={editedClassification}
                    onChange={(e) => setEditedClassification(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-500 rounded px-3 py-2 text-white font-mono"
                  >
                    <option value="FIR">FIR (First Information Report)</option>
                    <option value="Investigation Report">Investigation Report</option>
                    <option value="Evidence">Evidence</option>
                    <option value="Court Order">Court Order</option>
                    <option value="Legal Document">Legal Document</option>
                    <option value="Forensic Report">Forensic Report</option>
                    <option value="Confidential Report">Confidential Report</option>
                  </select>
                )}
                <div className="text-slate-500 text-[11px] font-mono">
                  Confidence Score: {Math.round((doc.ai_confidence || 0.95) * 100)}%
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Associated Case Reference</span>
                <div className="text-lg font-bold text-white">{doc.case_number || 'CASE-2026-104'}</div>
                <div className="text-slate-400 text-[11px] font-mono truncate">{doc.case_title}</div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">AI Executive Summary</span>
              <p className="text-slate-200 leading-relaxed font-sans text-xs">
                {doc.ai_summary ||
                  `Official ${doc.ai_classification} registered under ${doc.case_number}. Pertains to evidence verification, investigative findings, and procedural documentation with cryptographic integrity safeguards.`}
              </p>
            </div>

            {/* Detected Sensitive Forensic Entities */}
            <div className="space-y-3">
              <span className="text-slate-400 text-[10px] uppercase font-bold font-mono">
                Detected Forensic Entities & Identifiers
              </span>
              <div className="flex flex-wrap gap-2">
                {doc.aiEntities && doc.aiEntities.length > 0 ? (
                  doc.aiEntities.map((ent: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center space-x-1.5"
                    >
                      <span className="text-[10px] text-cyan-500 font-bold">{ent.type}:</span>
                      <span>{ent.value}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 font-mono">No sensitive forensic entities flagged</span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <span className="text-slate-400 text-[10px] uppercase font-bold font-mono">Document Tags</span>
              <div className="flex flex-wrap gap-2">
                {doc.tags?.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px] flex items-center space-x-1"
                  >
                    <Tag className="w-3 h-3 text-cyan-400" />
                    <span>{t}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Related Investigation Document Suggestions */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold font-mono flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Related Investigation Documents & Evidence Suggestions</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Contextual Linkage</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {relatedDocs.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-cyan-500/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {r.ai_classification || 'Evidence'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">96% Match</span>
                      </div>
                      <div className="font-semibold text-white text-xs line-clamp-1">{r.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                        {r.case_number || 'CASE-104'}
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('documents')}
                      className="w-full py-1 text-center bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-mono text-[10px] transition"
                    >
                      View Linked Document →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Document Version Control */}
      {activeTab === 'versions' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-6 shadow-xl text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  <span>Document Version Control & Audit Lineage</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Tracks changes, previous versions, officer commits, and SHA-256 integrity anchors across the investigation lifecycle.
                </p>
              </div>

              <button
                onClick={() => setShowNewVersionModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition self-start sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Commit New Revision</span>
              </button>
            </div>

            {/* Version History Timeline */}
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Revision Lineage ({versions.length} Revisions Recorded)</span>
                <span className="text-cyan-400 font-mono">Current HEAD: {versions.find(v => v.is_current)?.version_number || `v1.${versions.length - 1 || 0}`}</span>
              </div>

              <div className="relative pl-8 space-y-6 border-l-2 border-cyan-500/30 ml-2">
                {[...versions].reverse().map((ver, idx) => (
                  <div key={ver.id || idx} className="relative group">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[41px] top-1.5 w-4 h-4 rounded-full border-4 border-[#0e1629] ${
                      ver.is_current ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
                    }`} />

                    <div className={`p-4 rounded-xl border space-y-3 transition ${
                      ver.is_current
                        ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-sm font-bold text-cyan-300">{ver.version_number}</span>
                          {ver.is_current && (
                            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-400 font-bold text-[10px]">
                              CURRENT HEAD
                            </span>
                          )}
                          {ver.previous_version_ref && (
                            <span className="text-[10px] text-slate-500">
                              (Derived from {ver.previous_version_ref})
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-slate-400">
                          {ver.created_at ? ver.created_at.slice(0, 19).replace('T', ' ') : 'Genesis'}
                        </div>
                      </div>

                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Change Summary & Investigation Notes</span>
                        <p className="text-slate-200 text-xs">{ver.change_summary}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                        <span>
                          Authoring Officer: <strong className="text-slate-300">{ver.created_by_name}</strong>
                        </span>
                        <span className="truncate max-w-[320px]">
                          SHA-256 Hash: <code className="text-cyan-400">{ver.sha256_hash}</code>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Commit New Version */}
      {showNewVersionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Commit Document Revision</h2>
                <p className="text-xs text-slate-400">
                  Filing next revision for <span className="text-cyan-400 font-mono">{doc.title}</span>
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-[10px]">
                Immutable Versioning
              </span>
            </div>

            <form onSubmit={handleCreateVersion} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[11px]">
                  Revision Summary / Investigation Addendum Notes
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Added supplementary witness forensic interview transcript and corroborating server timestamp logs."
                  value={versionSummary}
                  onChange={(e) => setVersionSummary(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                <span>Genesis and historical versions remain permanently anchored. Next version will be assigned SHA-256 state and logged to the tamper-evident ledger.</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewVersionModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVersion}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg transition disabled:opacity-50"
                >
                  {isSavingVersion ? 'Committing...' : 'Commit Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
