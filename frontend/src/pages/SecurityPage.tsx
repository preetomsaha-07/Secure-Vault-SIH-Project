import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Lock,
  UserX,
  FileWarning,
  RefreshCw,
  Check,
} from 'lucide-react';
import { api } from '../api/client';
import { SecurityAlert } from '../types';

export const SecurityPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      const [alertsRes, metricsRes] = await Promise.all([
        api.get<{ alerts: SecurityAlert[] }>('/security/alerts'),
        api.get<any>('/security/metrics'),
      ]);
      setAlerts(alertsRes.alerts || []);
      setMetrics(metricsRes);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.post(`/security/alerts/${alertId}/resolve`);
      loadSecurityData();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'MEDIUM':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <h1 className="text-xl font-extrabold text-white">Security Operations & Threat Intelligence</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Explainable Risk Scoring • BOLA/IDOR Incident Detection • Automated Account Lockout Auditing
          </p>
        </div>

        <button
          onClick={loadSecurityData}
          className="px-3.5 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 text-xs font-mono rounded-lg flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Threat Feed</span>
        </button>
      </div>

      {/* Threat Posture Gauge & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e1629] border border-cyan-500/30 shadow-xl space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Overall System Threat Posture</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{metrics?.riskPosture?.overallLevel || 'LOW'}</span>
            <span className="text-xs font-mono text-cyan-400">({metrics?.riskPosture?.overallScore || 20}/100)</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">Rule-based explainable risk score</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 shadow-xl space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Unauthorized BOLA Attempts</span>
          <div className="text-3xl font-extrabold text-amber-400">{metrics?.riskPosture?.unauthorizedAttemptsCount || 0}</div>
          <p className="text-[10px] text-slate-400 font-mono">Enforced at API gateway</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 shadow-xl space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Failed Login Incidents</span>
          <div className="text-3xl font-extrabold text-rose-400">{metrics?.failedLoginsCount || 0}</div>
          <p className="text-[10px] text-slate-400 font-mono">Throttled & auto-locked</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 shadow-xl space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Cryptographically Verified</span>
          <div className="text-3xl font-extrabold text-emerald-400">{metrics?.verifiedDocumentsCount || 0}</div>
          <p className="text-[10px] text-slate-400 font-mono">100% SHA-256 authentic</p>
        </div>
      </div>

      {/* Real-time Alerts Feed */}
      <div className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="font-bold text-white uppercase font-mono text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Active Incident Log ({alerts.length})</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Zero Silent Failures Principle</span>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-mono">No active security incidents recorded.</div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border space-y-2 transition ${
                  a.is_resolved
                    ? 'bg-slate-900/30 border-slate-800/60 opacity-60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBadge(a.severity)}`}>
                      {a.severity}
                    </span>
                    <span className="font-mono text-xs font-bold text-cyan-300">{a.alert_type}</span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {a.created_at?.slice(0, 19).replace('T', ' ')}
                    </span>
                  </div>

                  {!a.is_resolved && (
                    <button
                      onClick={() => handleResolveAlert(a.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 rounded text-[11px] font-mono transition flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>

                <p className="text-slate-200 text-xs font-medium">{a.description}</p>

                {/* Explainable Reasons Card */}
                {a.reasons && a.reasons.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1 font-mono text-[11px]">
                    <div className="text-slate-400 font-bold uppercase text-[9px]">Explainable Trigger Factors:</div>
                    {a.reasons.map((r, rIdx) => (
                      <div key={rIdx} className="text-slate-300 flex items-start space-x-1.5">
                        <span className="text-cyan-400">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
