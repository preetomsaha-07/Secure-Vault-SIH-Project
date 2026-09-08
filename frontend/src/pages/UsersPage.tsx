import React, { useState, useEffect } from 'react';
import { Users, Shield, Building2, UserCheck, HardDrive } from 'lucide-react';
import { api } from '../api/client';
import { User, Department } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<any | null>(null);

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
    } catch {}
  };

  return (
    <div className="space-y-6 pb-16 text-xs">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-extrabold text-white">Personnel & Departmental Governance</h1>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Identity Provisioning • Clearance Levels • Departmental Compartmentalization
        </p>
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
        <div className="px-5 py-3 border-b border-slate-800 font-mono font-bold text-white uppercase">
          Authorized Officer Roster
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
                  <td className="py-3 px-4 text-slate-300">{u.departmentName}</td>
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
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
