import React, { useState, useEffect } from 'react';
import {
  Lock,
  Shield,
  ArrowRight,
  AlertCircle,
  UserPlus,
  LogIn,
  KeyRound,
  Smartphone,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Fingerprint,
} from 'lucide-react';
import { useAuth, DEMO_PERSONAS, PersonaType } from '../context/AuthContext';
import { api } from '../api/client';
import { UserRole } from '../types';

interface LoginPageProps {
  onSuccess: () => void;
  onBackToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onBackToLanding }) => {
  const { login, isLoading } = useAuth();
  const [viewState, setViewState] = useState<'credentials' | 'otp'>('credentials');
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

  // 2FA / OTP State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInputs, setOtpInputs] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [otpTargetOfficer, setOtpTargetOfficer] = useState<{
    name: string;
    badge: string;
    role: string;
    email: string;
    password: string;
    isRegistration: boolean;
    registrationData?: any;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    if (viewState !== 'otp' || otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [viewState, otpCountdown]);

  // Issue new OTP
  const issueNewOtp = (officer: typeof otpTargetOfficer) => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpInputs(['', '', '', '', '', '']);
    setOtpCountdown(60);
    setError(null);
    setViewState('otp');
  };

  // Quick Persona click -> Enforces OTP step!
  const handleInitiateQuickLogin = (pKey: PersonaType) => {
    setError(null);
    const p = DEMO_PERSONAS[pKey];
    const officerInfo = {
      name: p.name,
      badge: p.badge,
      role: p.role,
      email: p.email,
      password: 'Password123!',
      isRegistration: false,
    };
    setOtpTargetOfficer(officerInfo);
    issueNewOtp(officerInfo);
  };

  // Standard Login submit -> Enforces OTP step!
  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide your official email and password.');
      return;
    }

    const officerInfo = {
      name: email.split('@')[0].toUpperCase(),
      badge: `SV-OFF-${Math.floor(100 + Math.random() * 900)}`,
      role: 'INVESTIGATOR',
      email: email.toLowerCase().trim(),
      password,
      isRegistration: false,
    };

    if (email.includes('admin')) {
      officerInfo.name = DEMO_PERSONAS['admin'].name;
      officerInfo.badge = DEMO_PERSONAS['admin'].badge;
      officerInfo.role = DEMO_PERSONAS['admin'].role;
    } else if (email.includes('inv.a')) {
      officerInfo.name = DEMO_PERSONAS['inv_a'].name;
      officerInfo.badge = DEMO_PERSONAS['inv_a'].badge;
      officerInfo.role = DEMO_PERSONAS['inv_a'].role;
    } else if (email.includes('inv.b')) {
      officerInfo.name = DEMO_PERSONAS['inv_b'].name;
      officerInfo.badge = DEMO_PERSONAS['inv_b'].badge;
      officerInfo.role = DEMO_PERSONAS['inv_b'].role;
    } else if (email.includes('auditor')) {
      officerInfo.name = DEMO_PERSONAS['auditor'].name;
      officerInfo.badge = DEMO_PERSONAS['auditor'].badge;
      officerInfo.role = DEMO_PERSONAS['auditor'].role;
    }

    setOtpTargetOfficer(officerInfo);
    issueNewOtp(officerInfo);
  };

  // Register submit -> Enforces OTP step!
  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regFullName || !regEmail || !regPassword) {
      setError('Please fill in all required registration fields.');
      return;
    }

    const officerInfo = {
      name: regFullName,
      badge: regBadge,
      role: regRole,
      email: regEmail.toLowerCase().trim(),
      password: regPassword,
      isRegistration: true,
      registrationData: {
        fullName: regFullName,
        email: regEmail,
        badgeNumber: regBadge,
        role: regRole,
        password: regPassword,
      },
    };

    setOtpTargetOfficer(officerInfo);
    issueNewOtp(officerInfo);
  };

  // Handle OTP Digit Input
  const handleOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpInputs];
    updated[index] = clean;
    setOtpInputs(updated);

    // Auto advance focus
    if (clean && index < 5) {
      const next = document.getElementById(`sv-otp-box-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      const prev = document.getElementById(`sv-otp-box-${index - 1}`);
      prev?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpInputs(updated);
    const targetIdx = Math.min(5, pasted.length);
    document.getElementById(`sv-otp-box-${targetIdx}`)?.focus();
  };

  const handleAutoFillOtp = () => {
    if (!generatedOtp) return;
    setOtpInputs(generatedOtp.split(''));
  };

  // Verify OTP and complete login
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const entered = otpInputs.join('');

    if (entered.length < 6) {
      setError('Please enter the complete 6-digit authentication OTP.');
      return;
    }

    if (entered !== generatedOtp) {
      setError('Invalid Security OTP. Authentication rejected. Event logged to security audit trail.');
      return;
    }

    if (!otpTargetOfficer) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (otpTargetOfficer.isRegistration && otpTargetOfficer.registrationData) {
        await api.post('/auth/register', otpTargetOfficer.registrationData);
      }
      await login(otpTargetOfficer.email, otpTargetOfficer.password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication session verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/20 border border-cyan-400/30 mx-auto">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wider">
            SECURE<span className="text-cyan-400">VAULT</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">Restricted Access Legal Evidence Portal</p>
        </div>

        {/* VIEW 1: CREDENTIALS & PERSONA SELECTION */}
        {viewState === 'credentials' && (
          <>
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
                {/* Real-World Law Enforcement Personas Banner */}
                <div className="p-4 rounded-xl bg-[#0e1629] border border-cyan-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                      <Shield className="w-3.5 h-3.5 mr-1" /> Authorized Officer Personas
                    </span>
                    <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-800/60 font-mono">
                      Requires 2FA OTP
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(Object.keys(DEMO_PERSONAS) as PersonaType[]).map((pKey) => {
                      const p = DEMO_PERSONAS[pKey];
                      return (
                        <button
                          key={pKey}
                          type="button"
                          onClick={() => handleInitiateQuickLogin(pKey)}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-400 text-left transition group hover:bg-cyan-950/30 relative"
                        >
                          <div className="font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                            {pKey === 'admin' && '👑 Dr. Sen, IPS (Admin)'}
                            {pKey === 'inv_a' && '🔍 Insp. Preetom (Lead Inv)'}
                            {pKey === 'inv_b' && '🚫 DSP Rajesh (EOW Inv)'}
                            {pKey === 'auditor' && '🛡️ Adv. Meenakshi (Auditor)'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                            {pKey === 'inv_a'
                              ? 'Case 104 Lead • 2FA'
                              : pKey === 'inv_b'
                              ? 'Case 102 • 403 on 104'
                              : `${p.badge} • 2FA`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Standard Credentials Form */}
                <form
                  onSubmit={handleSubmitLogin}
                  className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl"
                >
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
                    <label className="text-xs text-slate-400 font-medium">Official Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. inv.a@securevault.local"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Security Password</label>
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
                    <span>Proceed to 2FA OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {/* REGISTER NEW OFFICER TAB */}
            {activeTab === 'register' && (
              <form
                onSubmit={handleSubmitRegister}
                className="p-6 rounded-2xl bg-[#0e1629] border border-slate-800 space-y-4 shadow-xl"
              >
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
                    placeholder="e.g. Sub-Inspector Alok Mishra"
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
                    placeholder="e.g. SV-CYBER-812"
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
                    placeholder="a.mishra@cybercell.gov.in"
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
                    <option value="INVESTIGATOR">INVESTIGATOR (Case Intake & Evidence Handling)</option>
                    <option value="AUDITOR">AUDITOR (Compliance & Ledger Verification)</option>
                    <option value="ADMINISTRATOR">ADMINISTRATOR (System Governance & PKI Root)</option>
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
                  <span>Proceed to 2FA Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </>
        )}

        {/* VIEW 2: TWO-FACTOR AUTHENTICATION (2FA / OTP) */}
        {viewState === 'otp' && (
          <form
            onSubmit={handleVerifyOtp}
            className="p-6 rounded-2xl bg-[#0e1629] border border-cyan-500/40 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Top Security Icon */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Officer 2FA Verification</h3>
                  <p className="text-[10px] text-cyan-400 font-mono">Two-Factor Authentication Enforced</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-300">
                Step 2 of 2
              </span>
            </div>

            {/* Officer Identification Banner */}
            {otpTargetOfficer && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>{otpTargetOfficer.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Badge: <span className="text-cyan-400">{otpTargetOfficer.badge}</span> • Role: {otpTargetOfficer.role}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <Fingerprint className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
            )}

            {/* Simulated Secure Dispatch Notification Alert */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 text-xs space-y-1.5 shadow-inner">
              <div className="flex items-center justify-between font-mono text-[11px] text-cyan-300">
                <span className="flex items-center space-x-1">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>GovNet Terminal OTP Dispatch</span>
                </span>
                <span className="text-[10px] text-slate-400">Encrypted SMS / TOTP</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="text-slate-300 font-mono text-[11px]">
                  Verification Code:{' '}
                  <span className="text-cyan-300 font-extrabold tracking-widest text-sm bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                    {generatedOtp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded text-[10px] font-mono text-cyan-300 font-bold transition hover:text-white"
                >
                  📋 Auto-Fill
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 6 Digit OTP Inputs */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Enter 6-Digit Verification Code</span>
                <span className="text-slate-500">Auto-validating</span>
              </label>

              <div className="flex justify-between gap-1.5 sm:gap-2">
                {otpInputs.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`sv-otp-box-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handlePasteOtp}
                    className="w-11 h-12 text-center font-mono text-lg font-extrabold text-cyan-300 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Decrypting Session...' : 'Verify OTP & Establish Session'}</span>
            </button>

            {/* Resend and Back buttons */}
            <div className="flex items-center justify-between pt-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => issueNewOtp(otpTargetOfficer)}
                disabled={otpCountdown > 0}
                className="text-slate-400 hover:text-cyan-300 disabled:text-slate-600 flex items-center space-x-1 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${otpCountdown > 0 ? '' : 'text-cyan-400'}`} />
                <span>
                  {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Resend New OTP'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewState('credentials');
                  setError(null);
                }}
                className="text-slate-400 hover:text-white flex items-center space-x-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Officer</span>
              </button>
            </div>
          </form>
        )}

        {/* Back to Public Landing Page Link */}
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

