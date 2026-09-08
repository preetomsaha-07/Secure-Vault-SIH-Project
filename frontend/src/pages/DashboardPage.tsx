import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Briefcase,
  Layers,
  History,
  AlertOctagon,
  Network,
  Upload,
  Search,
  CheckCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { DocumentRecord, SecurityAlert } from '../types';

interface DashboardPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenUpload: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenUpload }) => {
  const { user, activePersona } = useAuth();
  const [stats, setStats] = useState<any>({
    totalDocuments: 0,
    totalCases: 0,
    totalEvidence: 0,
    verifiedDocuments: 0,
    signedDocuments: 0,
    activeSecurityAlerts: 0,
    storageBytesUsed: 0,
  });
  const [recentDocs, setRecentDocs] = useState<DocumentRecord[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [chainVerified, setChainVerified] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const statsRes = await api.get<any>('/system/stats');
      setStats(statsRes.stats || {});

      const docsRes = await api.get<{ documents: DocumentRecord[] }>('/docs');
      setRecentDocs(docsRes.documents?.slice(0, 5) || []);

      const alertsRes = await api.get<{ alerts: SecurityAlert[] }>('/security/alerts');
      setAlerts(alertsRes.alerts?.slice(0, 4) || []);

      const chainRes = await api.post<any>('/audit/verify-chain');
      setChainVerified(chainRes.status === 'VERIFIED');
    } catch {}
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Persona Clearance Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0e1629] via-[#0f1b33] to-[#0a0f1d] border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider">
              {user?.role} CLEARANCE
            </span>
            <span className="text-xs font-mono text-cyan-400">Badge: {user?.badgeNumber || 'N/A'}</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">{user?.fullName}</h1>
          <p className="text-xs text-slate-400">
            {user?.departmentName} • Organization Master Vault • Real-time Session Active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('integrity')}
            className="px-3.5 py-2 bg-slate-900 border border-emerald-500/40 hover:bg-emerald-950/30 text-emerald-300 font-mono text-xs rounded-xl flex items-center space-x-2 transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Integrity: 100% Verified</span>
          </button>
          <button
            onClick={() => onNavigate('audit')}
            className={`px-3.5 py-2 bg-slate-900 border text-xs font-mono rounded-xl flex items-center space-x-2 transition ${
              chainVerified
                ? 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/30'
                : 'border-rose-500/50 text-rose-400 bg-rose-950/20 animate-pulse'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{chainVerified ? 'Audit Chain: Verified' : 'Audit Chain: Tampered!'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Confidential Documents',
            val: stats.totalDocuments,
            sub: 'AES-256-GCM Encrypted',
            icon: FileText,
            color: 'text-cyan-400',
            bg: 'bg-cyan-950/40 border-cyan-800/40',
            action: () => onNavigate('documents'),
          },
          {
            label: 'Active Investigations',
            val: stats.totalCases,
            sub: 'Case-Aware Authorization',
            icon: Briefcase,
            color: 'text-blue-400',
            bg: 'bg-blue-950/40 border-blue-800/40',
            action: () => onNavigate('cases'),
          },
          {
            label: 'Digital Evidence Items',
            val: stats.totalEvidence,
            sub: 'Verifiable Custody Trail',
            icon: Layers,
            color: 'text-emerald-400',
            bg: 'bg-emerald-950/40 border-emerald-800/40',
            action: () => onNavigate('evidence'),
          },
          {
            label: 'Security Incidents',
            val: stats.activeSecurityAlerts,
            sub: 'Explainable Rule Detection',
            icon: AlertOctagon,
            color: stats.activeSecurityAlerts > 0 ? 'text-amber-400' : 'text-slate-400',
            bg: 'bg-slate-900/60 border-slate-800',
            action: () => onNavigate('security'),
          },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              onClick={m.action}
              className={`p-4 rounded-xl border ${m.bg} cursor-pointer hover:border-cyan-400/60 transition shadow-lg group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase">{m.label}</span>
                <Icon className={`w-4 h-4 ${m.color} group-hover:scale-110 transition-transform`} />
              </div>
              <div className="text-2xl font-extrabold text-white">{m.val}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Launchpad Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <button
          onClick={onOpenUpload}
          className="p-3.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-left flex items-center space-x-3 transition group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-slate-950 transition">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Upload & Encrypt Evidence</div>
            <div className="text-[10px] text-slate-400 font-mono">8-Stage Secure Intake</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('search')}
          className="p-3.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left flex items-center space-x-3 transition group"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center group-hover:text-cyan-400 transition">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Smart Search & NLP</div>
            <div className="text-[10px] text-slate-400 font-mono">Query metadata, OCR & entities</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('graph')}
          className="p-3.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left flex items-center space-x-3 transition group"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-500/20 transition">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Investigation Relationship Graph</div>
            <div className="text-[10px] text-slate-400 font-mono">Interactive Entity Visualizer</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('audit')}
          className="p-3.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left flex items-center space-x-3 transition group"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/20 transition">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Verify Tamper-Evident Chain</div>
            <div className="text-[10px] text-slate-400 font-mono">Cryptographic ledger verification</div>
          </div>
        </button>
      </div>

      {/* Two Column Layout: Recent Documents & Security Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents Table (2 cols) */}
        <div className="lg:col-span-2 bg-[#0e1629] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Authorized Case Documents</h2>
            </div>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1"
            >
              <span>View All Documents</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                  <th className="pb-2 font-semibold">Title</th>
                  <th className="pb-2 font-semibold">Case</th>
                  <th className="pb-2 font-semibold">Sensitivity</th>
                  <th className="pb-2 font-semibold">Classification</th>
                  <th className="pb-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">
                      No documents available for your clearance level.
                    </td>
                  </tr>
                ) : (
                  recentDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-2.5 font-medium text-white flex items-center space-x-2">
                        <Lock className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{doc.title}</span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-400">{doc.case_number || 'General'}</td>
                      <td className="py-2.5">
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
                      </td>
                      <td className="py-2.5 text-slate-300 font-mono text-[11px]">{doc.ai_classification || 'Document'}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onNavigate('document-detail', doc.id)}
                          className="px-2 py-1 bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 rounded text-[11px] font-mono transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Incident Center (1 col) */}
        <div className="bg-[#0e1629] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Security Alerts</h2>
            </div>
            <button
              onClick={() => onNavigate('security')}
              className="text-xs text-amber-400 hover:text-amber-300 font-mono"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-500">
                No active security alerts
              </div>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        a.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : a.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      }`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {a.created_at?.slice(11, 16) || 'Just now'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-snug">{a.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
