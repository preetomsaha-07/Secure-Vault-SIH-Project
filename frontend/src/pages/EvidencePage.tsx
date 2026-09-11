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
  const [transferPurpose, setTransferPurpose] = useState('');
  const [transferLocation, setTransferLocation] = useState('Central Forensics Laboratory Suite 4B');

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
        purpose: transferPurpose,
        reason: transferPurpose,
        location: transferLocation,
      });
      setShowTransferModal(false);
      setNewCustodian('');
      setTransferPurpose('');
      setTransferLocation('Central Forensics Laboratory Suite 4B');
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

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'COLLECTED':
        return 'bg-amber-950/70 text-amber-300 border-amber-800';
      case 'UPLOADED':
        return 'bg-blue-950/70 text-blue-300 border-blue-800';
      case 'VERIFIED':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
      case 'ASSIGNED':
        return 'bg-indigo-950/70 text-indigo-300 border-indigo-800';
      case 'TRANSFERRED':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-800';
      case 'EXAMINED':
        return 'bg-purple-950/70 text-purple-300 border-purple-800';
      case 'SUBMITTED':
        return 'bg-pink-950/70 text-pink-300 border-pink-800';
      case 'ARCHIVED':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      default:
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-800';
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
            8-Stage forensic lifecycle, custodian transfers, location tracking, SHA-256 hash anchors, and court submission logs
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

      {/* 8-Stage Lifecycle Progress Legend */}
      <div className="bg-[#0e1629] border border-slate-800 rounded-xl p-3">
        <div className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-2 flex items-center justify-between">
          <span>8-Stage Legal Evidence Lifecycle Framework</span>
          <span className="text-cyan-400">Strict Forensic Integrity (ISO/IEC 27037 compliant)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-[10px] font-mono">
          {[
            { name: '1. COLLECTED', color: 'border-amber-700 bg-amber-950/40 text-amber-300' },
            { name: '2. UPLOADED', color: 'border-blue-700 bg-blue-950/40 text-blue-300' },
            { name: '3. VERIFIED', color: 'border-emerald-700 bg-emerald-950/40 text-emerald-300' },
            { name: '4. ASSIGNED', color: 'border-indigo-700 bg-indigo-950/40 text-indigo-300' },
            { name: '5. TRANSFERRED', color: 'border-cyan-700 bg-cyan-950/40 text-cyan-300' },
            { name: '6. EXAMINED', color: 'border-purple-700 bg-purple-950/40 text-purple-300' },
            { name: '7. SUBMITTED', color: 'border-pink-700 bg-pink-950/40 text-pink-300' },
            { name: '8. ARCHIVED', color: 'border-slate-700 bg-slate-800/40 text-slate-300' },
          ].map((stage, i) => (
            <div key={i} className={`p-1.5 rounded-lg border ${stage.color} font-semibold truncate`}>
              {stage.name}
            </div>
          ))}
        </div>
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
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-semibold">
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
                    Storage Vault: <span className="text-slate-300">{selectedEvidence.storage_location || 'Forensic Locker'}</span> • Case ID: <span className="text-cyan-400">{selectedEvidence.case_number || selectedEvidence.case_id}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                    Genesis SHA-256: {selectedEvidence.integrity_hash}
                  </p>
                </div>

                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition self-start sm:self-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Record Lifecycle Event</span>
                </button>
              </div>

              {/* Custody Timeline Visualization */}
              <div className="space-y-6">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  <span>Verifiable Custody Transfer History ({timeline.length} Steps)</span>
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cryptographic Linkage Active</span>
                  </span>
                </div>

                <div className="relative pl-8 space-y-6 border-l-2 border-cyan-500/30 ml-2">
                  {timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-cyan-500 border-4 border-[#0e1629] shadow-sm shadow-cyan-500/50" />

                      {/* Card */}
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 hover:border-cyan-500/40 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center space-x-2 font-mono">
                            <span className={`px-2.5 py-0.5 rounded border font-bold text-[10px] ${getActionBadgeColor(event.action)}`}>
                              {event.action}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              Step #{idx + 1} • {event.timestamp?.slice(0, 19).replace('T', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-[11px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-400 flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{event.verification_status || 'VERIFIED'}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800 text-cyan-300">
                              Sig: {event.signature_status || 'VERIFIED'}
                            </span>
                          </div>
                        </div>

                        {/* Transfer Route: Prev Custodian -> New Custodian */}
                        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 py-1 font-mono bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800">
                          <div className="flex-1 truncate">
                            <span className="text-[10px] text-slate-500 block uppercase">Previous Custodian</span>
                            <span className="text-slate-300 font-semibold">{event.previous_custodian}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <div className="flex-1 truncate">
                            <span className="text-[10px] text-slate-500 block uppercase">New Custodian</span>
                            <span className="text-cyan-300 font-semibold">{event.new_custodian}</span>
                          </div>
                        </div>

                        {/* Purpose & Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 font-mono block uppercase mb-0.5">Purpose / Justification</span>
                            <p className="text-slate-300">{event.purpose || event.reason || 'Forensic custody transfer'}</p>
                          </div>
                          <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 font-mono block uppercase mb-0.5">Physical / Facility Location</span>
                            <p className="text-cyan-400 font-mono">{event.location || selectedEvidence.storage_location || 'Forensic Locker A-12'}</p>
                          </div>
                        </div>

                        {/* Performed by & Integrity Hash */}
                        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-500 font-mono">
                          <span>
                            Authorized by: <strong className="text-slate-400">{event.performed_by_name || 'Investigator'}</strong> {event.badge_number ? `(${event.badge_number})` : ''}
                          </span>
                          <span className="truncate max-w-[280px]">
                            SHA-256: <code className="text-cyan-400">{event.integrity_hash}</code>
                          </span>
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

      {/* Transfer / Record Lifecycle Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Record Custody Lifecycle Event</h2>
                <p className="text-xs text-slate-400">
                  Item: <span className="text-cyan-400 font-mono">{selectedEvidence?.evidence_number}</span> ({selectedEvidence?.title})
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-[10px]">
                8-Stage Protocol
              </span>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[11px]">
                  1. Lifecycle Action Stage
                </label>
                <select
                  value={transferAction}
                  onChange={(e) => setTransferAction(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="COLLECTED">1. COLLECTED - Initial scene recovery & physical acquisition</option>
                  <option value="UPLOADED">2. UPLOADED - Secure ingest & cryptographic hash calculation</option>
                  <option value="VERIFIED">3. VERIFIED - Forensic bitstream verification & integrity seal</option>
                  <option value="ASSIGNED">4. ASSIGNED - Allocated to investigating officer / lab analyst</option>
                  <option value="TRANSFERRED">5. TRANSFERRED - Secure inter-department or inter-agency handover</option>
                  <option value="EXAMINED">6. EXAMINED - Forensic extraction, reverse-engineering, triage</option>
                  <option value="SUBMITTED">7. SUBMITTED - Formal court submission & prosecution evidence filing</option>
                  <option value="ARCHIVED">8. ARCHIVED - Secure cold-storage preservation post-proceedings</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[11px]">
                  2. Receiving Custodian / Division
                </label>
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
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[11px]">
                  3. Facility / Storage Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Digital Forensics Division Lab Suite 4B, Station Locker 12"
                  value={transferLocation}
                  onChange={(e) => setTransferLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[11px]">
                  4. Purpose / Investigative Justification
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Handover for hardware chip desoldering, memory extraction, and bitstream corroboration for court filing."
                  value={transferPurpose}
                  onChange={(e) => setTransferPurpose(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                <span>Cryptographic Assertion: Evidence ID <span className="text-cyan-400">{selectedEvidence?.id}</span> • Case <span className="text-cyan-400">{selectedEvidence?.case_number || '104'}</span> will be signed with officer credentials and committed to the audit chain.</span>
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
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg transition"
                >
                  Authorize & Sign Custody Record
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
