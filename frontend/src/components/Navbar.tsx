import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Bell,
  Lock,
  UserCheck,
  ChevronDown,
  LogOut,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth, DEMO_PERSONAS, PersonaType } from '../context/AuthContext';
import { api } from '../api/client';

interface NavbarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView }) => {
  const { user, activePersona, switchPersona, logout } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<{ overallLevel: string; overallScore: number }>({
    overallLevel: 'LOW',
    overallScore: 20,
  });

  useEffect(() => {
    if (user) {
      loadRiskMetrics();
      loadNotifications();
    }
  }, [user, currentView]);

  const loadRiskMetrics = async () => {
    try {
      const res = await api.get<any>('/security/metrics');
      if (res.riskPosture) {
        setRiskMetrics(res.riskPosture);
      }
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get<any>('/system/notifications');
      setNotifications(res.notifications || []);
    } catch {}
  };

  const handleSelectPersona = async (personaKey: PersonaType) => {
    setShowPersonaMenu(false);
    await switchPersona(personaKey);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <header className="h-16 bg-[#0a0f1d] border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-lg tracking-wider text-white">SECURE<span className="text-cyan-400">VAULT</span></span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              Prototype
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono tracking-tight">AES-256-GCM • Tamper-Evident • Evidence Chain</p>
        </div>
      </div>

      {/* Live Demonstration Persona Switcher */}
      <div className="hidden lg:flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1 space-x-1 shadow-inner">
        <span className="text-xs text-slate-400 px-2 font-mono flex items-center">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> Demo Persona:
        </span>
        {(Object.keys(DEMO_PERSONAS) as PersonaType[]).map((pKey) => {
          const p = DEMO_PERSONAS[pKey];
          const isActive = activePersona === pKey;
          return (
            <button
              key={pKey}
              onClick={() => handleSelectPersona(pKey)}
              className={`px-3 py-1 text-xs rounded font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {pKey === 'admin' && '👑 Admin'}
              {pKey === 'inv_a' && '🔍 Inv A (Lead 104)'}
              {pKey === 'inv_b' && '🚫 Inv B (Unassigned)'}
              {pKey === 'auditor' && '🛡️ Auditor'}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Risk Posture, Notifications, Profile */}
      <div className="flex items-center space-x-4">
        {/* Risk Posture Indicator */}
        <button
          onClick={() => onNavigate('security')}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium ${getRiskColor(
            riskMetrics.overallLevel
          )}`}
          title={`Explainable Risk Score: ${riskMetrics.overallScore}/100`}
        >
          {riskMetrics.overallLevel === 'CRITICAL' ? (
            <ShieldAlert className="w-3.5 h-3.5" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5" />
          )}
          <span>Risk: {riskMetrics.overallLevel}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg relative transition"
          >
            <Bell className="w-4 h-4" />
            {notifications.filter((n) => !n.is_read).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
                <span>Security Notifications</span>
                <span className="text-[10px] text-cyan-400">{notifications.length} alerts</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 mt-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No unread security alerts</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="text-xs p-2 rounded bg-slate-800/60 border border-slate-700/50">
                      <div className="font-semibold text-slate-200">{n.title}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active User Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center space-x-2 pl-2 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition"
          >
            <div className="w-7 h-7 rounded-md bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">
              {user?.fullName?.slice(0, 2).toUpperCase() || 'SV'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-medium text-white truncate max-w-[120px]">{user?.fullName || 'Anonymous'}</div>
              <div className="text-[10px] font-mono text-cyan-400 leading-none">{user?.role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-xs">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="font-bold text-slate-200">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 font-mono">{user?.email}</p>
                <p className="text-[10px] text-cyan-400 mt-1">Badge: {user?.badgeNumber || 'N/A'}</p>
              </div>

              <div className="py-2">
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Switch Persona (Demo Mode)
                </div>
                {(Object.keys(DEMO_PERSONAS) as PersonaType[]).map((pKey) => {
                  const p = DEMO_PERSONAS[pKey];
                  return (
                    <button
                      key={pKey}
                      onClick={() => handleSelectPersona(pKey)}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 rounded flex items-center justify-between text-slate-300 hover:text-white"
                    >
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.role}</div>
                      </div>
                      {activePersona === pKey && <UserCheck className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => onNavigate('landing')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 rounded flex items-center space-x-2 text-slate-300 hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public Landing Page</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded flex items-center space-x-2 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
