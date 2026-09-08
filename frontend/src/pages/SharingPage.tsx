import React, { useState, useEffect } from 'react';
import {
  Share2,
  Clock,
  Lock,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Key,
  Calendar,
  Eye,
  Download,
} from 'lucide-react';
import { api } from '../api/client';
import { DocumentRecord, AccessRequest } from '../types';
import { useAuth } from '../context/AuthContext';

export const SharingPage: React.FC = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'share-links' | 'jit-requests'>('share-links');

  // Share Generator State
  const [selectedDocId, setSelectedDocId] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [canDownload, setCanDownload] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Request Access State
  const [reqDocId, setReqDocId] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqDuration, setReqDuration] = useState(2);
  const [reqSuccess, setReqSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDocs();
    loadRequests();
  }, []);

  const loadDocs = async () => {
    try {
      const res = await api.get<{ documents: DocumentRecord[] }>('/docs');
      setDocs(res.documents || []);
    } catch {}
  };

  const loadRequests = async () => {
    try {
      const res = await api.get<{ requests: AccessRequest[] }>('/access-requests');
      setRequests(res.requests || []);
    } catch {}
  };

  const handleGenerateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/share', {
        documentId: selectedDocId,
        password: sharePassword || undefined,
        canDownload,
        expiresInHours,
      });
      setGeneratedLink(window.location.origin + res.shareUrl);
    } catch (err: any) {
      alert(`Share link generation failed: ${err.message}`);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/access-requests', {
        documentId: reqDocId,
        reason: reqReason,
        durationHours: reqDuration,
      });
      setReqSuccess('Just-in-time access request submitted to authorized officers.');
      setReqReason('');
      loadRequests();
    } catch (err: any) {
      alert(`Request submission failed: ${err.message}`);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/access-requests/${id}/approve`);
      loadRequests();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/access-requests/${id}/reject`);
      loadRequests();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-16 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-extrabold text-white">Secure Sharing & Just-In-Time Access</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            High-Entropy Secure URLs • Time-Bound Permissions • Administrative Approval Workflow
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-800 font-mono">
        <button
          onClick={() => setActiveTab('share-links')}
          className={`pb-2.5 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'share-links'
              ? 'border-cyan-400 text-cyan-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>High-Entropy Share Generator</span>
        </button>
        <button
          onClick={() => setActiveTab('jit-requests')}
          className={`pb-2.5 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'jit-requests'
              ? 'border-cyan-400 text-cyan-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Just-In-Time (JIT) Requests ({requests.filter((r) => r.status === 'PENDING').length})</span>
        </button>
      </div>

      {/* Tab 1: Share Links */}
      {activeTab === 'share-links' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleGenerateShare} className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Generate Encrypted Share Link
            </h2>

            <div>
              <label className="block text-slate-400 mb-1">Select Document</label>
              <select
                required
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              >
                <option value="">-- Choose Document --</option>
                {docs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.sensitivity_level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Passphrase Protection (Optional)</label>
              <input
                type="password"
                placeholder="Require password to decrypt..."
                value={sharePassword}
                onChange={(e) => setSharePassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-5">
                <input
                  type="checkbox"
                  id="can-download-check"
                  checked={canDownload}
                  onChange={(e) => setCanDownload(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="can-download-check" className="text-slate-300 select-none">
                  Allow Download Copy
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedDocId}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 transition"
            >
              Generate 192-Bit Random Link
            </button>
          </form>

          {/* Generated Result */}
          <div className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Link Security Specifications
            </h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>
                SecureVault share links utilize cryptographically secure 192-bit pseudo-random tokens. Document contents are never embedded into URLs.
              </p>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px] text-cyan-300">
                <div>• Automatic expiration enforcement</div>
                <div>• Optional Bcrypt-authenticated password protection</div>
                <div>• Instant administrative revocation</div>
                <div>• Full access audit logging on retrieval</div>
              </div>

              {generatedLink && (
                <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/50 space-y-2 mt-4">
                  <div className="text-cyan-300 font-bold text-xs">Generated Secure Token URL:</div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-white break-all">
                    {generatedLink}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      alert('Copied secure URL to clipboard!');
                    }}
                    className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold rounded text-xs transition"
                  >
                    Copy Secure Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: JIT Access Requests */}
      {activeTab === 'jit-requests' && (
        <div className="space-y-6">
          {/* Create Request Form */}
          <form onSubmit={handleCreateRequest} className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl">
            <div className="font-bold text-white uppercase font-mono">Request Temporary Clearance Access</div>
            {reqSuccess && <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded text-emerald-300">{reqSuccess}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Restricted Document</label>
                <select
                  required
                  value={reqDocId}
                  onChange={(e) => setReqDocId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="">-- Choose Restricted Document --</option>
                  {docs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.sensitivity_level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Requested Duration</label>
                <select
                  value={reqDuration}
                  onChange={(e) => setReqDuration(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours (Standard)</option>
                  <option value={4}>4 Hours</option>
                  <option value={8}>8 Hours (Full Shift)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Justification Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cross-case ballistics comparison"
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!reqDocId || !reqReason}
              className="px-4 py-2 bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg font-mono"
            >
              Submit JIT Request
            </button>
          </form>

          {/* Requests Queue Table */}
          <div className="bg-[#0e1629] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3 border-b border-slate-800 font-mono font-bold text-white uppercase">
              Clearance Requests Queue
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-4 font-semibold">Requester</th>
                    <th className="py-2.5 px-4 font-semibold">Document</th>
                    <th className="py-2.5 px-4 font-semibold">Justification</th>
                    <th className="py-2.5 px-4 font-semibold">Duration</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 font-mono">
                        No active JIT access requests.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{r.requester_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Badge: {r.badge_number || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-300">{r.document_title}</td>
                        <td className="py-3 px-4 text-slate-300">{r.reason}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{r.duration_hours} Hours</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                              r.status === 'APPROVED'
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                : r.status === 'REJECTED'
                                ? 'bg-rose-950/60 text-rose-400 border-rose-800'
                                : 'bg-amber-950/60 text-amber-400 border-amber-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {user?.role === 'ADMINISTRATOR' && r.status === 'PENDING' ? (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleApprove(r.id)}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">
                              {r.status === 'APPROVED' ? `Expires: ${r.expires_at?.slice(11, 16)}` : 'Closed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
