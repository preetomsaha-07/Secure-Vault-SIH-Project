import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Layers,
  Network,
  Search,
  History,
  ShieldCheck,
  CheckCircle,
  FileSignature,
  AlertOctagon,
  Share2,
  Clock,
  QrCode,
  Users,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onOpenUpload }) => {
  const { user } = useAuth();

  const navigationGroups = [
    {
      title: 'CORE VAULT',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'documents', label: 'Documents & Files', icon: FileText },
        { id: 'cases', label: 'Cases & Investigations', icon: Briefcase },
        { id: 'evidence', label: 'Digital Evidence', icon: Layers },
        { id: 'graph', label: 'Investigation Graph', icon: Network, highlight: true },
        { id: 'search', label: 'Smart Search', icon: Search },
      ],
    },
    {
      title: 'TRUST & GOVERNANCE',
      items: [
        { id: 'audit', label: 'Audit Trail Ledger', icon: History },
        { id: 'integrity', label: 'Document Integrity', icon: ShieldCheck, highlight: true },
        { id: 'signatures', label: 'Digital Signatures', icon: FileSignature },
      ],
    },
    {
      title: 'OPERATIONS & ACCESS',
      items: [
        { id: 'security', label: 'Security Incident Center', icon: AlertOctagon },
        { id: 'sharing', label: 'Secure Sharing & Links', icon: Share2 },
        { id: 'access-requests', label: 'JIT Access Requests', icon: Clock },
        { id: 'qr-verify', label: 'Public QR Verification', icon: QrCode },
      ],
    },
  ];

  if (user?.role === 'ADMINISTRATOR') {
    navigationGroups[2].items.push({ id: 'admin-users', label: 'Users & Departments', icon: Users });
  }

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800 flex flex-col h-[calc(100vh-4rem)] select-none">
      {/* Quick Action: Encrypted Upload Button */}
      <div className="p-4 border-b border-slate-800/80">
        <button
          onClick={onOpenUpload}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition-all duration-150"
        >
          <Shield className="w-4 h-4 text-slate-950" />
          <span>Upload Evidence</span>
        </button>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? 'text-cyan-400'
                            : item.highlight
                            ? 'text-cyan-500/80'
                            : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.highlight && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Security Badge */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-center">
        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-300 font-mono">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>AES-256-GCM Active</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">Encrypted Object Store</p>
      </div>
    </aside>
  );
};
