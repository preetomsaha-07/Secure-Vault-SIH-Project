import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Users, FileText, Layers, Lock, Shield, ChevronRight } from 'lucide-react';
import { api } from '../api/client';
import { Case, Department } from '../types';

interface CasesPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CasesPage: React.FC<CasesPageProps> = ({ onNavigate }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Case Form
  const [caseNumber, setCaseNumber] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deptId, setDeptId] = useState('');
  const [sensitivity, setSensitivity] = useState('CONFIDENTIAL');

  useEffect(() => {
    loadCases();
    loadDepartments();
  }, []);

  const loadCases = async () => {
    try {
      const res = await api.get<{ cases: Case[] }>('/cases');
      setCases(res.cases || []);
    } catch {}
  };

  const loadDepartments = async () => {
    try {
      const res = await api.get<{ departments: Department[] }>('/system/departments');
      setDepartments(res.departments || []);
    } catch {}
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/cases', {
        caseNumber,
        title,
        description: desc,
        departmentId: deptId,
        sensitivityLevel: sensitivity,
      });
      setShowCreateModal(false);
      setCaseNumber('');
      setTitle('');
      setDesc('');
      loadCases();
    } catch (err: any) {
      alert(`Case creation failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-extrabold text-white">Investigation Cases Registry</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Departmental Isolation • Case-Based Access Control • Active Custody Boundaries
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation Case</span>
        </button>
      </div>

      {/* Cases Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map((c) => (
          <div
            key={c.id}
            onClick={() => onNavigate('case-detail', c.id)}
            className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition shadow-xl space-y-4 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-extrabold text-cyan-400">{c.case_number}</span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      c.sensitivity_level === 'TOP_SECRET'
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                        : c.sensitivity_level === 'SECRET'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                        : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                    }`}
                  >
                    {c.sensitivity_level}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                    {c.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 group-hover:text-cyan-300 transition">
                  {c.title}
                </h3>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{c.description}</p>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="text-[11px] text-slate-400 font-sans">{c.department_name}</span>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c.member_count || 1}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c.document_count || 0}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c.evidence_count || 0}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white">Create New Investigation Case</h2>
            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Case Number Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CASE-2026-105"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Investigation Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operation Falcon: Telemetry Espionage"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Department</label>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Sensitivity Classification</label>
                <select
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="SECRET">SECRET</option>
                  <option value="TOP_SECRET">TOP_SECRET</option>
                  <option value="UNRESTRICTED">UNRESTRICTED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Scope & Objective</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Detailed description of the investigative mandate..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 transition"
                >
                  Initialize Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
