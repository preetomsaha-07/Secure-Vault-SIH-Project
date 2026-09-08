import React, { useState } from 'react';
import { Lock, Shield, ArrowRight, UserCheck, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { useAuth, DEMO_PERSONAS, PersonaType } from '../context/AuthContext';
import { api } from '../api/client';
import { UserRole } from '../types';

interface LoginPageProps {
  onSuccess: () => void;
  onBackToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onBackToLanding }) => {
  const { login, switchPersona, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regBadge, setRegBadge] = useState(`SV-INV-${Math.floor(100 + Math.random() * 900)}`);
  const [regRole, setRegRole] = useState<UserRole>('INVESTIGATOR');
  const [regPassword, setRegPassword] = useState('Password123!');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickLogin = async (persona: PersonaType) => {
    setError(null);
    try {
      const p = DEMO_PERSONAS[persona];
      setEmail(p.email);
      setPassword('Password123!');
      await switchPersona(persona);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post('/auth/register', {
        fullName: regFullName,
        email: regEmail,
        badgeNumber: regBadge,
        role: regRole,
        password: regPassword,
      });

      // Login with new credentials
      await login(regEmail, regPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to register officer credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/20 border border-cyan-400/30 mx-auto">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wider">
            SECURE<span className="text-cyan-400">VAULT</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">Restricted Access Legal Evidence Portal</p>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div className="grid grid-cols-2 p-1 bg-[#0e1629] border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`py-2 text-xs font-mono font-bold rounded-lg flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'login'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Official Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`py-2 text-xs font-mono font-bold rounded-lg flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'register'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register New Officer</span>
          </button>
        </div>

        {/* SIGN IN TAB */}
        {activeTab === 'login' && (
          <>
            {/* Demo Personas Quick-Access Banner */}
            <div className="p-4 rounded-xl bg-[#0e1629] border border-cyan-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                  <Shield className="w-3.5 h-3.5 mr-1" /> Hackathon Demo Quick-Access
                </span>
                <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-800/60 font-mono">
                  1-Click Auto-Fill
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {(Object.keys(DEMO_PERSONAS) as PersonaType[]).map((pKey) => {
                  const p = DEMO_PERSONAS[pKey];
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => handleQuickLogin(pKey)}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-400 text-left transition group hover:bg-cyan-950/30"
                    >
                      <div className="font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                        {pKey === 'admin' && '👑 Arthur (Admin)'}
                        {pKey === 'inv_a' && '🔍 Sharma (Inv A)'}
                        {pKey === 'inv_b' && '🚫 Marcus (Inv B)'}
                        {pKey === 'auditor' && '🛡️ Elena (Auditor)'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                        {pKey === 'inv_a'
                          ? 'Lead Case 104'
                          : pKey === 'inv_b'
                          ? 'Unassigned on 104'
                          : p.role}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Login Form */}
            <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl">
              <div className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                Standard Credentials Login
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-2 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@securevault.local"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition"
              >
                <span>Authenticate Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {/* REGISTER NEW OFFICER TAB */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl">
            <div className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-cyan-400" />
              <span>Officer Registration & Key Generation</span>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Officer Full Name</label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="e.g. Detective Sarah Jenkins"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Official Badge Number</label>
              <input
                type="text"
                required
                value={regBadge}
                onChange={(e) => setRegBadge(e.target.value)}
                placeholder="e.g. SV-INV-108"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Official Email Address</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="s.jenkins@securevault.local"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Clearance Level Role</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="INVESTIGATOR">INVESTIGATOR (Case Intake & Evidence)</option>
                <option value="AUDITOR">AUDITOR (Compliance & Ledger Verification)</option>
                <option value="ADMINISTRATOR">ADMINISTRATOR (System Governance)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Access Password</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition"
            >
              <span>Create Credentials & Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-xs text-slate-500 hover:text-cyan-400 transition font-mono"
          >
            ← Return to Public Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};
