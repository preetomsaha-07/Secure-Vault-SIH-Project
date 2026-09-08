import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Users,
  FileText,
  Layers,
  History,
  AlertOctagon,
  UserPlus,
  Lock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { Case, CaseMember, DocumentRecord, EvidenceRecord, AuditRecord, SecurityAlert, User } from '../types';
import { useAuth } from '../context/AuthContext';

interface CaseDetailPageProps {
  caseId: string;
  onBack: () => void;
  onNavigate: (view: string, param?: string) => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({ caseId, onBack, onNavigate }) => {
  const { user } = useAuth();
  const [caseRecord, setCaseRecord] = useState<Case | null>(null);
  const [members, setMembers] = useState<CaseMember[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [timeline, setTimeline] = useState<AuditRecord[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [roleInCase, setRoleInCase] = useState('INVESTIGATOR');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCaseDetails();
    loadAllUsers();
  }, [caseId]);

  const loadCaseDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>(`/cases/${caseId}`);
      setCaseRecord(res.case);
      setMembers(res.members || []);
      setDocuments(res.documents || []);
      setEvidence(res.evidence || []);
      setTimeline(res.timeline || []);
      setSecurityAlerts(res.securityAlerts || []);
    } catch (err: any) {
      alert(`Access denied: ${err.message}`);
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await api.get<{ users: User[] }>('/system/users');
      setAllUsers(res.users || []);
    } catch {}
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/cases/${caseId}/assign`, {
        userId: selectedUserId,
        roleInCase,
      });
      setShowAssignModal(false);
      setSelectedUserId('');
      loadCaseDetails();
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  if (isLoading || !caseRecord) {
    return <div className="py-12 text-center text-xs font-mono text-slate-400">Loading case dossier...</div>;
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
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
              <span className="font-mono font-extrabold text-cyan-400">{caseRecord.case_number}</span>
              <h1 className="text-xl font-extrabold text-white">{caseRecord.title}</h1>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  caseRecord.sensitivity_level === 'TOP_SECRET'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                    : caseRecord.sensitivity_level === 'SECRET'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                }`}
              >
                {caseRecord.sensitivity_level}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Dept: {caseRecord.department_name} • Status: {caseRecord.status} • Lead: {caseRecord.creator_name || 'Chief Inspector'}
            </p>
          </div>
        </div>

        {user?.role === 'ADMINISTRATOR' && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Assign Investigator</span>
          </button>
        )}
      </div>

      {/* Overview Description */}
      <div className="p-4 rounded-xl bg-[#0e1629] border border-slate-800 text-xs text-slate-300 space-y-1">
        <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Case Mandate & Scope</span>
        <p className="leading-relaxed font-sans">{caseRecord.description}</p>
      </div>

      {/* Grid: Assigned Investigators & Documents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Members Column (1 col) */}
        <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Assigned Personnel ({members.length})</span>
            </span>
          </div>

          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">{m.full_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Badge: {m.badge_number || 'N/A'}</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  {m.role_in_case}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Case Documents Column (2 cols) */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Case Evidence Documents ({documents.length})</span>
            </span>
          </div>

          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-slate-500 py-4 text-center font-mono">No documents attached to this case.</p>
            ) : (
              documents.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onNavigate('document-detail', d.id)}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between transition group"
                >
                  <div className="flex items-center space-x-3">
                    <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-slate-200 group-hover:text-cyan-300">{d.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {d.original_filename} • {d.ai_classification} • SHA-256: {d.sha256_hash.slice(0, 10)}...
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      d.sensitivity_level === 'TOP_SECRET'
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                        : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                    }`}
                  >
                    {d.sensitivity_level}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Case Timeline / Audit Trail (Visual Investigation Timeline) */}
      <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl text-xs">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-white">Visual Investigation Case Timeline</h2>
        </div>

        <div className="relative pl-6 space-y-4 border-l-2 border-slate-800 ml-2">
          {timeline.length === 0 ? (
            <p className="text-slate-500 font-mono">No chronological timeline entries recorded yet.</p>
          ) : (
            timeline.map((event, idx) => (
              <div key={idx} className="relative">
                {/* Node marker */}
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-[#0e1629]" />
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-300 font-mono">{event.action}</span>
                    <span className="text-slate-500 font-mono">{event.timestamp?.slice(0, 19).replace('T', ' ')}</span>
                  </div>
                  <p className="text-slate-300 text-xs">{event.details || 'Investigation activity recorded.'}</p>
                  <div className="text-[10px] text-slate-500 font-mono">Logged by: {event.user_name}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assign Member Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white">Assign Investigator to {caseRecord.case_number}</h2>
            <form onSubmit={handleAssignUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Officer / Investigator</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">-- Choose User --</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role} - {u.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned Case Role</label>
                <select
                  value={roleInCase}
                  onChange={(e) => setRoleInCase(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="INVESTIGATOR">INVESTIGATOR</option>
                  <option value="LEAD_INVESTIGATOR">LEAD_INVESTIGATOR</option>
                  <option value="FORENSIC_ANALYST">FORENSIC_ANALYST</option>
                  <option value="LEGAL_COUNSEL">LEGAL_COUNSEL</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 transition"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
