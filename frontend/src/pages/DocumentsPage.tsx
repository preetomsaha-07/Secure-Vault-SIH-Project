import React, { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  Search,
  Lock,
  ShieldCheck,
  Download,
  Eye,
  Plus,
  FileSignature,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';
import { DocumentRecord, Case, Department } from '../types';

interface DocumentsPageProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenUpload: () => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onNavigate, onOpenUpload }) => {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSensitivity, setSelectedSensitivity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedCase, selectedDept, selectedSensitivity]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let endpoint = '/docs?';
      if (selectedCase) endpoint += `caseId=${selectedCase}&`;
      if (selectedDept) endpoint += `departmentId=${selectedDept}&`;
      if (selectedSensitivity) endpoint += `sensitivity=${selectedSensitivity}&`;

      const [docsRes, casesRes, deptsRes] = await Promise.all([
        api.get<{ documents: DocumentRecord[] }>(endpoint),
        api.get<{ cases: Case[] }>('/cases'),
        api.get<{ departments: Department[] }>('/system/departments'),
      ]);

      setDocs(docsRes.documents || []);
      setCases(casesRes.cases || []);
      setDepartments(deptsRes.departments || []);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const filteredDocs = docs.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.title.toLowerCase().includes(term) ||
      d.original_filename.toLowerCase().includes(term) ||
      d.case_number?.toLowerCase().includes(term) ||
      d.ai_classification?.toLowerCase().includes(term) ||
      d.sha256_hash.toLowerCase().includes(term)
    );
  });

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      await api.download(`/docs/${doc.id}/download`, doc.original_filename);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-extrabold text-white">Confidential Evidence & Documents</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            AES-256-GCM Encrypted Storage • Multi-Layered ABAC Clearance Enforcement
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Evidence</span>
        </button>
      </div>

      {/* Filters Strip */}
      <div className="p-4 rounded-xl bg-[#0e1629] border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, hash, case..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Case filter */}
        <select
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="">All Cases</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.case_number} - {c.title}
            </option>
          ))}
        </select>

        {/* Department filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>

        {/* Sensitivity filter */}
        <select
          value={selectedSensitivity}
          onChange={(e) => setSelectedSensitivity(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="">All Sensitivity Levels</option>
          <option value="UNRESTRICTED">UNRESTRICTED</option>
          <option value="CONFIDENTIAL">CONFIDENTIAL</option>
          <option value="SECRET">SECRET</option>
          <option value="TOP_SECRET">TOP_SECRET</option>
        </select>
      </div>

      {/* Documents Catalog Table */}
      <div className="bg-[#0e1629] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <th className="py-3 px-4 font-semibold">Document Title & Filename</th>
                <th className="py-3 px-4 font-semibold">Case Reference</th>
                <th className="py-3 px-4 font-semibold">Sensitivity</th>
                <th className="py-3 px-4 font-semibold">AI Classification</th>
                <th className="py-3 px-4 font-semibold">SHA-256 Fingerprint</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    Loading cryptographic document ledger...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    No documents matching clearance criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white flex items-center space-x-2">
                        <Lock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="truncate max-w-[220px]">{doc.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {doc.original_filename} • {(doc.file_size / 1024).toFixed(1)} KB
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {doc.case_number ? (
                        <div>
                          <div className="font-semibold text-cyan-300">{doc.case_number}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{doc.case_title}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">General</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
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

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
                        {doc.ai_classification || 'Document'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span title={doc.sha256_hash}>
                          {doc.sha256_hash.slice(0, 8)}...{doc.sha256_hash.slice(-8)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onNavigate('document-detail', doc.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 rounded text-xs font-mono transition"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download Decrypted & Watermarked Copy"
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
