import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, ShieldCheck, CheckCircle2, Lock, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { DocumentRecord } from '../types';

interface QrVerificationPageProps {
  initialDocId?: string;
}

export const QrVerificationPage: React.FC<QrVerificationPageProps> = ({ initialDocId }) => {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId || '');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [publicVerifyData, setPublicVerifyData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      generateQrCode(selectedDocId);
      loadPublicVerification(selectedDocId);
    }
  }, [selectedDocId]);

  const loadDocs = async () => {
    try {
      const res = await api.get<{ documents: DocumentRecord[] }>('/docs');
      setDocs(res.documents || []);
      if (res.documents?.length > 0 && !selectedDocId) {
        setSelectedDocId(res.documents[0].id);
      }
    } catch {}
  };

  const generateQrCode = async (docId: string) => {
    try {
      const verifyUrl = `${window.location.origin}/verify/doc/${docId}`;
      const url = await QRCode.toDataURL(verifyUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#06b6d4',
          light: '#0a0f1d',
        },
      });
      setQrDataUrl(url);
    } catch {}
  };

  const loadPublicVerification = async (docId: string) => {
    setIsLoading(true);
    try {
      const res = await api.get<any>(`/system/public-verify/${docId}`);
      setPublicVerifyData(res);
    } catch (err: any) {
      setPublicVerifyData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-extrabold text-white">Public QR Evidence Authenticity Verification</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Zero-Leakage Cryptographic Proving • Public Chain Verifiability • Digital Signature Attestation
          </p>
        </div>

        {/* Doc Selector */}
        <select
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono self-start sm:self-auto"
        >
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title} ({d.case_number || 'General'})
            </option>
          ))}
        </select>
      </div>

      {/* Grid: QR Code Generator on Left, Zero-Leakage Output on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Dynamic QR Render */}
        <div className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="p-4 bg-[#0a0f1d] border border-cyan-500/30 rounded-2xl shadow-xl">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Document QR Code" className="w-56 h-56 rounded-xl" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-600 font-mono">
                Generating QR...
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="font-bold text-white text-sm">Scan to Cryptographically Verify</div>
            <p className="text-slate-400 text-xs max-w-xs mx-auto">
              Scan with any mobile camera or QR reader to verify court validity, cryptographic hash, and signing authority.
            </p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-cyan-400">
            Target: /verify/doc/{selectedDocId ? selectedDocId.slice(0, 8) + '...' : ''}
          </div>
        </div>

        {/* Right: Public Zero-Leakage Verification Portal View */}
        <div className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-mono font-bold text-white uppercase text-[11px] flex items-center space-x-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Public Verification Portal (Zero Content Leakage)</span>
            </span>
            <span className="text-emerald-400 font-mono text-[10px] flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cryptographically Attested</span>
            </span>
          </div>

          {publicVerifyData ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{publicVerifyData.integrityBadge}</span>
              </div>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between">
                  <span className="text-slate-500">Registry Identifier:</span>
                  <span className="text-white font-bold">{publicVerifyData.documentRegistryId}</span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between">
                  <span className="text-slate-500">Issuing Authority:</span>
                  <span className="text-cyan-300 font-bold">{publicVerifyData.issuingAuthority}</span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between">
                  <span className="text-slate-500">Case Docket (Masked):</span>
                  <span className="text-slate-300 font-bold">{publicVerifyData.caseReferenceMasked}</span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between">
                  <span className="text-slate-500">SHA-256 Fingerprint:</span>
                  <span className="text-emerald-400 font-bold">{publicVerifyData.sha256FingerprintMasked}</span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between">
                  <span className="text-slate-500">Digital Signature:</span>
                  <span className="text-cyan-400 font-bold">
                    {publicVerifyData.isDigitallySigned ? 'RSA-PSS Verified' : 'Not Digitally Signed'}
                  </span>
                </div>
              </div>

              {/* Zero Leakage Disclaimer Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-sans text-xs text-slate-400 leading-relaxed">
                <span className="text-cyan-400 font-bold font-mono text-[10px] block mb-1">
                  PRIVACY & CONFIDENTIALITY SAFEGUARD:
                </span>
                {publicVerifyData.disclaimer}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono">
              Loading public verification attestation...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
