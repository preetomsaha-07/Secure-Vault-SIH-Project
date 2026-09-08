import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Building2,
  UserCheck,
  HardDrive,
  UserPlus,
  X,
  KeyRound,
  Mail,
  BadgeCheck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { User, Department, UserRole } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<any | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [departmentId, setDepartmentId] = useState('dept_inv');
  const [role, setRole] = useState<UserRole>('INVESTIGATOR');
  const [password, setPassword] = useState('Password123!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [uRes, dRes, sRes] = await Promise.all([
        api.get<{ users: User[] }>('/system/users'),
        api.get<{ departments: Department[] }>('/system/departments'),
        api.get<any>('/system/stats'),
      ]);
      setUsers(uRes.users || []);
      setDepartments(dRes.departments || []);
      setStats(sRes);
      if (dRes.departments && dRes.departments.length > 0) {
        setDepartmentId(dRes.departments[0].id);
      }
    } catch {}
  };

  const handleOpenModal = () => {
    setFullName('');
    setEmail('');
    setBadgeNumber(`SV-INV-${Math.floor(100 + Math.random() * 900)}`);
    setPassword('Password123!');
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowAddModal(true);
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await api.post<{ user: User; message: string }>('/system/users', {
        fullName,
        email,
        badgeNumber,
        departmentId,
        role,
        password,
      });

      setSuccessMessage(`Officer ${res.user.fullName} (${res.user.badgeNumber}) provisioned successfully!`);
      // Reload user list
      await loadData();
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to provision user credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 text-xs">
      {/* Header with Provision Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-extrabold text-white">Personnel & Departmental Governance</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Identity Provisioning • Clearance Levels • Departmental Compartmentalization
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-slate-950" />
          <span>Provision New Officer</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0e1629] border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Authorized Officers</span>
          <div className="text-2xl font-extrabold text-white">{users.length}</div>
          <div className="text-[10px] text-emerald-400 font-mono">100% Active Directory Linked</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1629] border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Isolated Divisions</span>
          <div className="text-2xl font-extrabold text-cyan-400">{departments.length}</div>
          <div className="text-[10px] text-slate-400 font-mono">Compartmentalized Security</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1629] border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Encrypted Storage</span>
          <div className="text-2xl font-extrabold text-blue-400">
            {((stats?.stats?.storageBytesUsed || 0) / 1024).toFixed(1)} KB
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Private Object Store</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0e1629] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 font-mono font-bold text-white uppercase flex items-center justify-between">
          <span>Authorized Officer Roster ({users.length})</span>
          <span className="text-[10px] text-cyan-400 font-normal">Cryptographically Registered</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <th className="py-2.5 px-4 font-semibold">Officer Name & Email</th>
                <th className="py-2.5 px-4 font-semibold">Badge ID</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Division</th>
                <th className="py-2.5 px-4 font-semibold">Role Clearance</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{u.badgeNumber || 'N/A'}</td>
                  <td className="py-3 px-4 text-slate-300">{u.departmentName || 'General'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        u.role === 'ADMINISTRATOR'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          : u.role === 'AUDITOR'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center space-x-1 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>ACTIVE</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New Officer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white font-mono">Provision New Officer</h2>
                  <p className="text-[10px] text-slate-400 font-mono">Issue badge ID & clearance credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center space-x-2 text-xs text-emerald-400">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleProvisionUser} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Inspector Priya Sen"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Official Badge ID *</label>
                  <input
                    type="text"
                    required
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="e.g. SV-INV-108"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya.sen@securevault.local"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Assigned Department *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Clearance Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="INVESTIGATOR">INVESTIGATOR (Case Intake)</option>
                    <option value="AUDITOR">AUDITOR (Compliance & Ledger)</option>
                    <option value="ADMINISTRATOR">ADMINISTRATOR (Full Governance)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Initial Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password123!"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
                >
                  <span>Provision Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
