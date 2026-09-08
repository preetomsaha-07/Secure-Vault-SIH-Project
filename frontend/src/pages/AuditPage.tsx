import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Lock,
  ArrowDown,
  AlertTriangle,
  CheckCircle,
  Hash,
  Database,
} from 'lucide-react';
import { api } from '../api/client';
import { AuditRecord } from '../types';
import confetti from 'canvas-confetti';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isTampering, setIsTampering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
    runVerification();
  }, []);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ logs: AuditRecord[]; total: number }>('/audit/logs?limit=40');
      setLogs(res.logs || []);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await api.post<any>('/audit/verify-chain');
      setVerificationResult(res);
      if (res.status === 'VERIFIED') {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      alert(`Verification exception: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    setIsTampering(true);
    try {
      await api.post('/audit/tamper-demo');
      await loadAuditLogs();
      await runVerification();
    } catch (err: any) {
      alert(`Tamper demo failed: ${err.message}`);
    } finally {
      setIsTampering(false);
    }
  };

  const handleRepairChain = async () => {
    setIsTampering(true);
    try {
      await api.post('/audit/repair-chain');
      await loadAuditLogs();
      await runVerification();
    } catch (err: any) {
      alert(`Chain repair failed: ${err.message}`);
    } finally {
      setIsTampering(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-extrabold text-white">Tamper-Evident Audit Trail Ledger</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Cryptographic SHA-256 Block Chaining • Indelible Event Provenance • Genesis-Anchored
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={runVerification}
            disabled={isVerifying}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verify Audit Chain</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verificationResult && (
        <div
          className={`p-5 rounded-2xl border text-xs shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            verificationResult.status === 'VERIFIED'
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/60 text-rose-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2 font-bold text-sm">
              {verificationResult.status === 'VERIFIED' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>✅ AUDIT CHAIN VERIFIED</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                  <span>🚨 AUDIT CHAIN INTEGRITY FAILED</span>
                </>
              )}
            </div>
            <p className="text-xs leading-relaxed max-w-2xl">{verificationResult.message}</p>
            <div className="text-[11px] font-mono opacity-80">
              Evaluated {verificationResult.totalBlocks} blocks from Genesis Anchor • Last check:{' '}
              {verificationResult.verifiedAt?.slice(0, 19).replace('T', ' ')}
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto font-mono text-xs">
            {verificationResult.status === 'VERIFIED' ? (
              <button
                onClick={handleSimulateTamper}
                disabled={isTampering}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition"
              >
                Demonstrate Audit Tampering
              </button>
            ) : (
              <button
                onClick={handleRepairChain}
                disabled={isTampering}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition"
              >
                Re-anchor / Repair Chain
              </button>
            )}
          </div>
        </div>
      )}

      {/* Audit Blocks Visualization Strip */}
      <div className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
          <div className="flex items-center space-x-2 font-mono font-bold text-white">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Cryptographic Chained Audit Blocks</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">Formula: Hash(PrevHash + EventID + Action + ...)</span>
        </div>

        <div className="space-y-3">
          {logs.map((log, idx) => (
            <div key={log.id} className="relative">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/90 text-xs space-y-2 hover:border-cyan-500/40 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                      {log.action}
                    </span>
                    <span className="text-slate-300 font-semibold">{log.user_name}</span>
                    <span className="text-slate-500 font-mono text-[10px]">({log.ip_address})</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {log.timestamp?.slice(0, 19).replace('T', ' ')}
                  </span>
                </div>

                <p className="text-slate-300 text-xs font-sans">{log.details}</p>

                {/* Hashes */}
                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                  <div className="truncate max-w-sm">
                    <span className="text-slate-500">Prev: </span>
                    <span className={log.previous_hash.startsWith('00000000') ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      {log.previous_hash.slice(0, 16)}...{log.previous_hash.slice(-8)}
                      {log.previous_hash.startsWith('00000000') && ' (GENESIS ANCHOR)'}
                    </span>
                  </div>
                  <div className="truncate max-w-sm">
                    <span className="text-slate-500">Current Block Hash: </span>
                    <span className="text-cyan-300 font-bold">
                      {log.current_hash.slice(0, 16)}...{log.current_hash.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>

              {idx < logs.length - 1 && (
                <div className="flex justify-center my-1 text-cyan-500/40">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
