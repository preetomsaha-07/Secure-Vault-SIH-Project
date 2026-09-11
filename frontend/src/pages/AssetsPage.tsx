import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  ArrowRight,
  Wrench,
  Clock,
  MapPin,
  User,
  Briefcase,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Archive,
  RefreshCw,
  Send,
} from 'lucide-react';
import { api } from '../api/client';
import { PoliceAsset, AssetStatus, AssetType, Case } from '../types';

export const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<PoliceAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<PoliceAsset | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);

  // Form states
  const [newTag, setNewTag] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AssetType>('DIGITAL_FORENSIC_EQUIPMENT');
  const [newSerial, setNewSerial] = useState('');
  const [newDept, setNewDept] = useState('Cyber Forensics & Digital Investigation Cell');
  const [newLocation, setNewLocation] = useState('Station Armory Equipment Locker B2');
  const [newSchedule, setNewSchedule] = useState('Quarterly (Every 90 Days)');

  // Assign Form
  const [assignOfficer, setAssignOfficer] = useState('');
  const [assignPurpose, setAssignPurpose] = useState('');
  const [assignLocation, setAssignLocation] = useState('');

  // Maintenance Form
  const [maintType, setMaintType] = useState('CALIBRATION');
  const [maintTech, setMaintTech] = useState('');
  const [maintNotes, setMaintNotes] = useState('');
  const [maintNextDate, setMaintNextDate] = useState('');
  const [maintStatus, setMaintStatus] = useState<AssetStatus>('AVAILABLE');

  // Case association Form
  const [assocCaseId, setAssocCaseId] = useState('');

  useEffect(() => {
    loadAssets();
    loadCases();
  }, []);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ assets: PoliceAsset[] }>('/assets');
      const loaded = res.assets || [];
      setAssets(loaded);
      if (loaded.length > 0 && !selectedAsset) {
        setSelectedAsset(loaded[0]);
      } else if (selectedAsset) {
        const updated = loaded.find((a) => a.id === selectedAsset.id);
        if (updated) setSelectedAsset(updated);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const loadCases = async () => {
    try {
      const res = await api.get<{ cases: Case[] }>('/cases');
      setCases(res.cases || []);
    } catch {}
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ asset: PoliceAsset }>('/assets', {
        asset_tag: newTag,
        name: newName,
        type: newType,
        serial_number: newSerial,
        assigned_department: newDept,
        current_location: newLocation,
        maintenance_schedule: newSchedule,
      });
      setShowRegisterModal(false);
      setNewTag('');
      setNewName('');
      setNewSerial('');
      await loadAssets();
      if (res.asset) setSelectedAsset(res.asset);
    } catch (err: any) {
      alert(`Asset registration failed: ${err.message}`);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await api.post(`/assets/${selectedAsset.id}/assign`, {
        to_officer: assignOfficer,
        purpose: assignPurpose,
        location: assignLocation || selectedAsset.current_location,
      });
      setShowAssignModal(false);
      setAssignOfficer('');
      setAssignPurpose('');
      setAssignLocation('');
      await loadAssets();
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  const handleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await api.post(`/assets/${selectedAsset.id}/maintenance`, {
        maintenance_type: maintType,
        technician: maintTech,
        notes: maintNotes,
        next_due_date: maintNextDate,
        set_status: maintStatus,
      });
      setShowMaintModal(false);
      setMaintTech('');
      setMaintNotes('');
      await loadAssets();
    } catch (err: any) {
      alert(`Logging maintenance failed: ${err.message}`);
    }
  };

  const handleAssociateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const matched = cases.find((c) => c.id === assocCaseId);
    try {
      await api.post(`/assets/${selectedAsset.id}/associate-case`, {
        case_id: assocCaseId,
        case_number: matched?.case_number || 'CASE-2026-104',
      });
      setShowCaseModal(false);
      setAssocCaseId('');
      await loadAssets();
    } catch (err: any) {
      alert(`Case association failed: ${err.message}`);
    }
  };

  const handleReturnToArmory = async () => {
    if (!selectedAsset) return;
    if (!confirm(`Return ${selectedAsset.name} (${selectedAsset.asset_tag}) to Central Police Armory?`)) return;
    try {
      await api.post(`/assets/${selectedAsset.id}/return`, {
        reason: 'Investigation assignment completed, custody checked back into Armory locker',
      });
      await loadAssets();
    } catch (err: any) {
      alert(`Return failed: ${err.message}`);
    }
  };

  const handleRetire = async () => {
    if (!selectedAsset) return;
    if (!confirm(`Are you sure you want to decommission/retire ${selectedAsset.asset_tag}? This is a permanent lifecycle state.`)) return;
    try {
      await api.post(`/assets/${selectedAsset.id}/retire`, {
        reason: 'Decommissioned in accordance with statutory forensics lifecycle obsolescence guidelines',
      });
      await loadAssets();
    } catch (err: any) {
      alert(`Retirement failed: ${err.message}`);
    }
  };

  const filteredAssets = assets.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        a.asset_tag.toLowerCase().includes(term) ||
        a.name.toLowerCase().includes(term) ||
        a.serial_number.toLowerCase().includes(term) ||
        a.assigned_to_name?.toLowerCase().includes(term) ||
        a.associated_case_number?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
      case 'ASSIGNED':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700';
      case 'UNDER_MAINTENANCE':
        return 'bg-amber-950/80 text-amber-300 border-amber-700';
      case 'RETIRED':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-extrabold text-white">Police Asset & Equipment Lifecycle</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            End-to-end custody tracking: Registration → Assignment → Deployment → Maintenance → Return → Retirement
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Police Asset</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-[#0e1629] border border-slate-800 space-y-1">
          <div className="text-slate-400 uppercase text-[10px] font-bold">Total Police Assets</div>
          <div className="text-2xl font-bold text-white">{assets.length}</div>
          <div className="text-[10px] text-cyan-400">100% Barcoded & Logged</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1629] border border-slate-800 space-y-1">
          <div className="text-slate-400 uppercase text-[10px] font-bold">In Field Deployment</div>
          <div className="text-2xl font-bold text-cyan-300">
            {assets.filter((a) => a.status === 'ASSIGNED').length}
          </div>
          <div className="text-[10px] text-slate-400">Assigned to Active Officers</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1629] border border-slate-800 space-y-1">
          <div className="text-slate-400 uppercase text-[10px] font-bold">Armory Depository</div>
          <div className="text-2xl font-bold text-emerald-400">
            {assets.filter((a) => a.status === 'AVAILABLE').length}
          </div>
          <div className="text-[10px] text-slate-400">Ready for Immediate Dispatch</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1629] border border-slate-800 space-y-1">
          <div className="text-slate-400 uppercase text-[10px] font-bold">Maintenance / Calibration</div>
          <div className="text-2xl font-bold text-amber-400">
            {assets.filter((a) => a.status === 'UNDER_MAINTENANCE').length}
          </div>
          <div className="text-[10px] text-slate-400">Routine ISO Diagnostic Triage</div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="p-4 rounded-xl bg-[#0e1629] border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by tag, name, serial, officer..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
        >
          <option value="ALL">All Statuses (Available, Assigned, Maintenance)</option>
          <option value="AVAILABLE">AVAILABLE (Armory)</option>
          <option value="ASSIGNED">ASSIGNED (Field Investigation)</option>
          <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE (Diagnostics)</option>
          <option value="RETIRED">RETIRED (Decommissioned)</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
        >
          <option value="ALL">All Asset Types</option>
          <option value="DIGITAL_FORENSIC_EQUIPMENT">Digital Forensic Workstation</option>
          <option value="BODY_WORN_CAMERA">Body-Worn Camera</option>
          <option value="SURVEILLANCE_DRONE">Surveillance Drone</option>
          <option value="HARDWARE_WRITE_BLOCKER">Hardware Write-Blocker</option>
          <option value="MOBILE_EXTRACTION_DEVICE">Mobile Extraction Unit (UFED)</option>
          <option value="SECURE_EVIDENCE_CONTAINER">Biometric Evidence Locker</option>
        </select>
      </div>

      {/* Main Grid: List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Asset Registry List */}
        <div className="bg-[#0e1629] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white uppercase font-mono text-[11px]">
              Asset Registry ({filteredAssets.length})
            </span>
          </div>

          <div className="space-y-2">
            {filteredAssets.map((asset) => {
              const isSelected = selectedAsset?.id === asset.id;
              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-cyan-400">{asset.asset_tag}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-semibold ${getStatusBadge(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>
                  <div className="font-semibold text-white truncate">{asset.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center justify-between">
                    <span>SN: {asset.serial_number}</span>
                    <span className="text-cyan-300 truncate max-w-[130px]">
                      {asset.assigned_to_name ? `Held by: ${asset.assigned_to_name}` : 'Depot'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Asset Details & Lifecycle Timelines */}
        <div className="lg:col-span-2 space-y-6 text-xs">
          {selectedAsset ? (
            <div className="bg-[#0e1629] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-cyan-400">
                      {selectedAsset.asset_tag}
                    </span>
                    <h2 className="text-base font-bold text-white">{selectedAsset.name}</h2>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getStatusBadge(selectedAsset.status)}`}>
                      {selectedAsset.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Type: <span className="text-slate-300">{selectedAsset.type}</span> • Serial: <span className="text-slate-300">{selectedAsset.serial_number}</span>
                  </p>
                </div>

                {/* Lifecycle Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-1 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Assign / Transfer</span>
                  </button>

                  <button
                    onClick={() => setShowCaseModal(true)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 text-xs font-mono rounded-lg flex items-center space-x-1 transition"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Link Case</span>
                  </button>

                  <button
                    onClick={() => setShowMaintModal(true)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 text-xs font-mono rounded-lg flex items-center space-x-1 transition"
                  >
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    <span>Log Maint</span>
                  </button>

                  {selectedAsset.status === 'ASSIGNED' && (
                    <button
                      onClick={handleReturnToArmory}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-emerald-400 text-emerald-300 text-xs font-mono rounded-lg flex items-center space-x-1 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return</span>
                    </button>
                  )}

                  {selectedAsset.status !== 'RETIRED' && (
                    <button
                      onClick={handleRetire}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-rose-400 text-rose-300 text-xs font-mono rounded-lg flex items-center space-x-1 transition"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Retire</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Asset Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] block">Assigned Officer</span>
                  <div className="text-white font-bold truncate">
                    {selectedAsset.assigned_to_name || 'Unassigned (Armory)'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{selectedAsset.assigned_department}</div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] block">Physical Location</span>
                  <div className="text-cyan-300 font-bold truncate">{selectedAsset.current_location}</div>
                  <div className="text-[10px] text-slate-400">Custody: {selectedAsset.custody_officer_name}</div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] block">Investigation Case</span>
                  <div className="text-emerald-400 font-bold truncate">
                    {selectedAsset.associated_case_number || 'None (General Depot)'}
                  </div>
                  <div className="text-[10px] text-slate-400">Case ID: {selectedAsset.associated_case_id || 'N/A'}</div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] block">Maintenance Schedule</span>
                  <div className="text-amber-300 font-bold truncate">{selectedAsset.maintenance_schedule}</div>
                  <div className="text-[10px] text-slate-400">Last: {selectedAsset.last_maintenance_date?.slice(0, 10)}</div>
                </div>
              </div>

              {/* Assignment & Custody Lifecycle Timeline */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono font-bold text-white uppercase text-[11px] flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Custody Assignment & Usage History ({selectedAsset.assignment_history.length} Events)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verifiable Custody</span>
                  </span>
                </div>

                <div className="relative pl-8 space-y-4 border-l-2 border-cyan-500/30 ml-2">
                  {selectedAsset.assignment_history.map((ev, idx) => (
                    <div key={ev.id || idx} className="relative group">
                      <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-cyan-500 border-4 border-[#0e1629] shadow-sm shadow-cyan-500/50" />
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold text-[10px]">
                              {ev.action}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {ev.timestamp?.slice(0, 19).replace('T', ' ')}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            Verified by: {ev.verified_by}
                          </span>
                        </div>

                        {ev.from_officer && ev.to_officer && (
                          <div className="flex items-center space-x-2 text-xs font-mono text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                            <span className="text-slate-400">{ev.from_officer}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-cyan-300 font-semibold">{ev.to_officer}</span>
                          </div>
                        )}

                        <p className="text-slate-300 text-xs">{ev.purpose}</p>

                        <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>Location: {ev.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maintenance History */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono font-bold text-white uppercase text-[11px] flex items-center space-x-1.5">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Preventative Maintenance & Calibration History ({selectedAsset.maintenance_history.length} Logs)</span>
                  </span>
                </div>

                {selectedAsset.maintenance_history.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 font-mono">
                    No maintenance records logged yet. Equipment is in factory operational status.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedAsset.maintenance_history.map((m, idx) => (
                      <div key={m.id || idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-bold">
                            {m.maintenance_type}
                          </span>
                          <span className="text-slate-400">{m.performed_at?.slice(0, 10)}</span>
                        </div>
                        <p className="text-slate-200 text-xs">{m.notes}</p>
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Certified Tech: {m.technician}</span>
                          <span className="text-cyan-400">Next: {m.next_due_date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 font-mono bg-[#0e1629] border border-slate-800 rounded-2xl">
              Select a police asset from the catalog to inspect its full chain of custody and calibration logs.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Register Asset */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Register New Police Forensics Asset</h2>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-[10px]">
                Asset Registry
              </span>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Asset Tag / Barcode</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. POL-AST-1049"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Serial Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-894102-X"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Equipment Model & Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cellebrite UFED Touch 3 Rugged Tablet"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Asset Classification Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="DIGITAL_FORENSIC_EQUIPMENT">Digital Forensic Equipment / Station</option>
                  <option value="BODY_WORN_CAMERA">Body-Worn Camera</option>
                  <option value="SURVEILLANCE_DRONE">Surveillance Drone</option>
                  <option value="HARDWARE_WRITE_BLOCKER">Hardware Write-BlockER</option>
                  <option value="MOBILE_EXTRACTION_DEVICE">Mobile Extraction Unit (UFED)</option>
                  <option value="SECURE_EVIDENCE_CONTAINER">Secure Evidence Container / Safe</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Assigned Department / Division</label>
                <input
                  type="text"
                  required
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Base Armory Physical Location</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Maintenance Schedule</label>
                <input
                  type="text"
                  required
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg transition"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign / Transfer */}
      {showAssignModal && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Assign / Transfer Asset Custody</h2>
              <span className="text-cyan-400 font-mono text-xs">{selectedAsset.asset_tag}</span>
            </div>

            <form onSubmit={handleAssign} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Receiving Officer Name / Division</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Inspector Elena Rostova (DFL)"
                  value={assignOfficer}
                  onChange={(e) => setAssignOfficer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Deployment Purpose / Mission</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Deployed for on-scene triage and digital device acquisition during field raid."
                  value={assignPurpose}
                  onChange={(e) => setAssignPurpose(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Target Physical Location</label>
                <input
                  type="text"
                  placeholder="e.g. Mobile Forensic Van Unit 2 / Raid Site"
                  value={assignLocation}
                  onChange={(e) => setAssignLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 transition"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Maintenance */}
      {showMaintModal && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Log Asset Maintenance & Calibration</h2>
              <span className="text-amber-400 font-mono text-xs">{selectedAsset.asset_tag}</span>
            </div>

            <form onSubmit={handleMaintenance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Maintenance Type</label>
                <select
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="CALIBRATION">CALIBRATION (ISO/IEC Bitstream Accuracy)</option>
                  <option value="DIAGNOSTIC_HEALTH_CHECK">DIAGNOSTIC_HEALTH_CHECK (Hardware Self-Test)</option>
                  <option value="SOFTWARE_FIRMWARE_UPDATE">SOFTWARE_FIRMWARE_UPDATE (Firmware Patch)</option>
                  <option value="HARDWARE_REPAIR">HARDWARE_REPAIR (Component Replacement)</option>
                  <option value="BATTERY_REPLACEMENT">BATTERY_REPLACEMENT (Power Pack)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Certified Technician / Engineer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Certified Forensics Tech R. Bannerjee (OEM)"
                  value={maintTech}
                  onChange={(e) => setMaintTech(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Technical Notes / Findings</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Optical sensor clean, hardware write-blocker pass-through verified. Diagnostics passed 100%."
                  value={maintNotes}
                  onChange={(e) => setMaintNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Next Due Date</label>
                  <input
                    type="date"
                    value={maintNextDate}
                    onChange={(e) => setMaintNextDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Set Asset Status</label>
                  <select
                    value={maintStatus}
                    onChange={(e) => setMaintStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  >
                    <option value="AVAILABLE">AVAILABLE (Armory Ready)</option>
                    <option value="ASSIGNED">ASSIGNED (In Service)</option>
                    <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition"
                >
                  Record Maintenance Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Associate with Case */}
      {showCaseModal && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1629] border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Associate Asset with Investigation</h2>
              <span className="text-cyan-400 font-mono text-xs">{selectedAsset.asset_tag}</span>
            </div>

            <form onSubmit={handleAssociateCase} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Select Investigation Case</label>
                <select
                  required
                  value={assocCaseId}
                  onChange={(e) => setAssocCaseId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="">-- Select Active Case --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                <span>Linking this asset to a case establishes legal discovery alignment and evidence chain-of-custody admissibility.</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 transition"
                >
                  Associate Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
