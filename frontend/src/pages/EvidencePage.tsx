import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Calendar,
  FileCheck,
  Plus,
  RefreshCw,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { EvidenceRecord, CustodyEvent, Case } from '../types';

export const EvidencePage: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);
  const [timeline, setTimeline] = useState<CustodyEvent[]>([]);
  const [cases, setCases] = useState<Case[]>([]);

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newCustodian, setNewCustodian] = useState('');
  const [transferAction, setTransferAction] = useState('TRANSFERRED');
  const [transferReason, setTransferReason] = useState('');

  // New Evidence Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [evidenceNumber, setEvidenceNumber] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [caseId, setCaseId] = useState('');
  const [storageLoc, setStorageLoc] = useState('Forensic Vault A-12');

  useEffect(() => {
    loadEvidence();
    loadCases();
  }, []);

  const loadEvidence = async () => {
    try {
      const res = await api.get<{ evidence: EvidenceRecord[] }>('/evidence');
      setEvidenceList(res.evidence || []);
      if (res.evidence?.length > 0 && !selectedEvidence) {
        selectEvidence(res.evidence[0]);
      }
    } catch {}
  };

  const loadCases = async () => {
    try {
      const res = await api.get<{ cases: Case[] }>('/cases');
      setCases(res.cases || []);
    } catch {}
  };

  const selectEvidence = async (item: EvidenceRecord) => {
    setSelectedEvidence(item);
    try {
      const res = await api.get<{ evidence: EvidenceRecord; custodyTimeline: CustodyEvent[] }>(
        `/evidence/${item.id}`
      );
      setTimeline(res.custodyTimeline || []);
    } catch {}
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidence) return;

    try {
      await api.post(`/evidence/${selectedEvidence.id}/transfer`, {
        newCustodian,
        action: transferAction,
        reason: transferReason,
      });
      setShowTransferModal(false);
      setNewCustodian('');
      setTransferReason('');
      await selectEvidence(selectedEvidence);
      await loadEvidence();
    } catch (err: any) {
      alert(`Custody transfer failed: ${err.message}`);
    }
  };

  const handleRegisterEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/evidence', {
        evidenceNumber,
        title,
        description: desc,
        caseId,
        storageLocation: storageLoc,
      });
      setShowRegisterModal(false);
      setEvidenceNumber('');
      setTitle('');
      setDesc('');
      await loadEvidence();
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-extrabold text-white">Digital Evidence Chain of Custody</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Forensic intake, custodian transfers, tamper-evident hash logging, and court submission tracking
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Intake Evidence Item</span>
        </button>
      </div>

      {/* Main Grid: Left Evidence List & Right Custody Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Evidence List */}
        <div className="bg-[#0e1629] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white uppercase font-mono text-[11px]">
              Cataloged Evidence ({evidenceList.length})
            </span>
          </div>

          <div className="space-y-2">
            {evidenceList.map((ev) => {
              const isSelected = selectedEvidence?.id === ev.id;
              return (
                <div
                  key={ev.id}
                  onClick={() => selectEvidence(ev)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-cyan-400">{ev.evidence_number}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400">
                      {ev.status}
                    </span>
                  </div>
                  <div className="font-semibold text-white">{ev.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center justify-between">
                    <span>{ev.case_number || 'Case-104'}</span>
                    <span>Custodian: {ev.custodian_name || 'Investigator'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Chain of Custody Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-[#0e1629] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl text-xs">
          {selectedEvidence ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-cyan-400">
                      {selectedEvidence.evidence_number}
                    </span>
                    <h2 className="text-base font-bold text-white">{selectedEvidence.title}</h2>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Storage Vault: {selectedEvidence.storage_location || 'Forensic Locker'} • SHA-256:{' '}
                    {selectedEvidence.integrity_hash.slice(0, 16)}...
                  </p>
                </div>

                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition self-start sm:self-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transfer Custody</span>
                </button>
              </div>

              {/* Custody Timeline Visualization */}
              <div className="space-y-6">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                  Verifiable Custody Transfer History ({timeline.length} Steps)
                </div>

                <div className="relative pl-8 space-y-6 border-l-2 border-cyan-500/30 ml-2">
                  {timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-cyan-500 border-4 border-[#0e1629] shadow-sm shadow-cyan-500/50" />

                      {/* Card */}
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold text-[10px]">
                              {event.action}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              Step #{idx + 1} • {event.timestamp?.slice(0, 19).replace('T', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-mono">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Hash Verified</span>
                          </div>
                        </div>

                        {/* Transfer Route */}
                        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 py-1 font-mono">
                          <span className="text-slate-400 truncate max-w-[140px]">{event.previous_custodian}</span>
                          <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span className="text-cyan-300 truncate max-w-[140px]">{event.new_custodian}</span>
                        </div>

                        <p className="text-slate-300 text-xs">{event.reason}</p>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Authorized by: {event.performed_by_name || 'Investigator'}</span>
                          <span className="truncate max-w-[180px]">Hash: {event.integrity_hash}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono">
              Select an evidence item to view its verifiable chain of custody.
            </div>
          )}
        </div>
      </div>

      {/* Transfer Custody Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white">Transfer Evidence Custody</h2>
            <p className="text-xs text-slate-400">
              Transferring {selectedEvidence?.evidence_number}. Every transfer creates an indelible audit record.
            </p>

            <form onSubmit={handleTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Receiving Custodian / Division</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Forensic Analyst Elena Rostova (DFL)"
                  value={newCustodian}
                  onChange={(e) => setNewCustodian(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Transfer Action Category</label>
                <select
                  value={transferAction}
                  onChange={(e) => setTransferAction(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="TRANSFERRED">TRANSFERRED (Internal Handover)</option>
                  <option value="EVIDENCE_REVIEW">EVIDENCE_REVIEW (Forensic Audit)</option>
                  <option value="LEGAL_SUBMISSION">LEGAL_SUBMISSION (Court Admissibility)</option>
                  <option value="ARCHIVED">ARCHIVED (Long-term Evidence Locker)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Justification Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Submitted for hardware micro-probing and chip desoldering."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 transition"
                >
                  Authorize Custody Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Intake Evidence Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white">Intake New Physical / Digital Evidence</h2>
            <form onSubmit={handleRegisterEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Evidence Tag Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EV-2026-104-D"
                  value={evidenceNumber}
                  onChange={(e) => setEvidenceNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Evidence Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloned Vehicle Smart Key FOB"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Associated Case</label>
                <select
                  required
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="">-- Select Case --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Storage Location</label>
                <input
                  type="text"
                  placeholder="e.g. Forensic Locker B-09"
                  value={storageLoc}
                  onChange={(e) => setStorageLoc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 transition"
                >
                  Register into Custody
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
