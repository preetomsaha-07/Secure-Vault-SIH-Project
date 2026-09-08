import React, { useState, useEffect, useRef } from 'react';
import { Network, Filter, ZoomIn, ZoomOut, RotateCcw, Lock, Info, X } from 'lucide-react';
import { api } from '../api/client';
import { GraphData, Case } from '../types';

export const GraphPage: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    loadGraph();
  }, [selectedCaseId]);

  const loadCases = async () => {
    try {
      const res = await api.get<{ cases: Case[] }>('/cases');
      setCases(res.cases || []);
      if (res.cases?.length > 0 && !selectedCaseId) {
        // Default to Case 104 if present
        const case104 = res.cases.find((c) => c.case_number.includes('104'));
        if (case104) setSelectedCaseId(case104.id);
      }
    } catch {}
  };

  const loadGraph = async () => {
    try {
      const endpoint = selectedCaseId ? `/graph/investigation/${selectedCaseId}` : '/graph/investigation';
      const res = await api.get<GraphData>(endpoint);
      setGraphData(res);
      setSelectedNode(null);
    } catch {}
  };

  // Node color mapper
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'CASE':
        return '#06b6d4'; // Cyan
      case 'DOCUMENT':
        return '#3b82f6'; // Blue
      case 'EVIDENCE':
        return '#10b981'; // Emerald
      case 'PERSON':
        return '#f59e0b'; // Amber
      case 'VEHICLE':
        return '#8b5cf6'; // Purple
      case 'LOCATION':
        return '#f43f5e'; // Rose
      case 'ORGANIZATION':
        return '#14b8a6'; // Teal
      default:
        return '#94a3b8';
    }
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData || graphData.nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Position nodes radially or circularly around center
    const centerX = width / 2;
    const centerY = height / 2;
    const totalNodes = graphData.nodes.length;
    const nodeCoords = new Map<string, { x: number; y: number; node: any }>();

    // Put primary CASE node at center if single case
    let angleStep = (2 * Math.PI) / Math.max(1, totalNodes - 1);
    let angleIndex = 0;

    graphData.nodes.forEach((node, i) => {
      let x = centerX;
      let y = centerY;

      if (node.type === 'CASE' && totalNodes > 1) {
        x = centerX;
        y = centerY;
      } else {
        const radius = (Math.min(width, height) * 0.38) * (node.type === 'DOCUMENT' || node.type === 'EVIDENCE' ? 0.65 : 0.95);
        const angle = angleIndex * angleStep;
        x = centerX + radius * Math.cos(angle);
        y = centerY + radius * Math.sin(angle);
        angleIndex++;
      }

      nodeCoords.set(node.id, { x, y, node });
    });

    // Draw Edges
    ctx.save();
    ctx.lineWidth = 1.5;
    graphData.edges.forEach((edge) => {
      const source = nodeCoords.get(edge.source);
      const target = nodeCoords.get(edge.target);
      if (source && target) {
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        // Edge label
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        ctx.fillStyle = '#64748b';
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillText(edge.label.replace('MENTIONS_', ''), midX - 15, midY - 4);
      }
    });
    ctx.restore();

    // Draw Nodes
    nodeCoords.forEach(({ x, y, node }) => {
      const color = getNodeColor(node.type);
      const isSelected = selectedNode?.id === node.id;

      // Glow if selected
      if (isSelected) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowBlur = 0;
      }

      // Outer circle
      ctx.beginPath();
      const radius = node.type === 'CASE' ? 26 : node.type === 'DOCUMENT' || node.type === 'EVIDENCE' ? 18 : 14;
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = color;
      ctx.stroke();

      // Node Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = node.type === 'CASE' ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      const labelTruncated = node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label;
      ctx.fillText(labelTruncated, x, y + radius + 14);

      // Node Type pill
      ctx.fillStyle = color;
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillText(node.type, x, y + 3);
    });
  }, [graphData, selectedNode, zoom]);

  // Handle canvas click to select node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const totalNodes = graphData.nodes.length;
    let angleStep = (2 * Math.PI) / Math.max(1, totalNodes - 1);
    let angleIndex = 0;

    for (const node of graphData.nodes) {
      let x = centerX;
      let y = centerY;
      const radius = node.type === 'CASE' ? 26 : node.type === 'DOCUMENT' || node.type === 'EVIDENCE' ? 18 : 14;

      if (node.type !== 'CASE' || totalNodes <= 1) {
        const radDist = (Math.min(width, height) * 0.38) * (node.type === 'DOCUMENT' || node.type === 'EVIDENCE' ? 0.65 : 0.95);
        const angle = angleIndex * angleStep;
        x = centerX + radDist * Math.cos(angle);
        y = centerY + radDist * Math.sin(angle);
        angleIndex++;
      }

      const dist = Math.hypot(clickX - x, clickY - y);
      if (dist <= radius + 6) {
        setSelectedNode(node);
        return;
      }
    }

    setSelectedNode(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-extrabold text-white">Investigation Relationship Graph</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Visual link analysis connecting Cases, Persons, Vehicles, Locations, Evidence, and Documents
          </p>
        </div>

        {/* Case Selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Authorized Cases</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} - {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Entity Legend */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#0e1629] border border-slate-800 text-[11px] font-mono">
        <span className="text-slate-400 font-bold uppercase text-[10px]">Entity Legend:</span>
        {[
          { label: 'CASE', color: 'bg-cyan-500' },
          { label: 'DOCUMENT', color: 'bg-blue-500' },
          { label: 'EVIDENCE', color: 'bg-emerald-500' },
          { label: 'PERSON', color: 'bg-amber-500' },
          { label: 'VEHICLE', color: 'bg-purple-500' },
          { label: 'LOCATION', color: 'bg-rose-500' },
        ].map((item) => (
          <div key={item.label} className="flex items-center space-x-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-slate-300">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Canvas & Inspector Container */}
      <div className="relative bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl min-h-[550px] flex">
        <canvas
          ref={canvasRef}
          width={850}
          height={550}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair"
        />

        {/* Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900/95 border-l border-slate-800 p-5 shadow-2xl z-20 space-y-4 animate-in slide-in-from-right duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase"
                style={{ backgroundColor: `${getNodeColor(selectedNode.type)}20`, color: getNodeColor(selectedNode.type) }}
              >
                {selectedNode.type} NODE
              </span>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white break-words">{selectedNode.label}</h3>
              <p className="text-[11px] text-slate-400 font-mono">ID: {selectedNode.id}</p>
            </div>

            {selectedNode.sensitivity && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] flex items-center justify-between">
                <span className="text-slate-400">Clearance Required:</span>
                <span className="text-cyan-300 font-bold">{selectedNode.sensitivity}</span>
              </div>
            )}

            {/* Entity Attributes */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Forensic Metadata</div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
                {selectedNode.details ? (
                  Object.entries(selectedNode.details).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-0.5">
                      <span className="text-slate-500 capitalize">{k}:</span>
                      <span className="text-white truncate max-w-[140px]">{String(v)}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500">No additional properties</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-start space-x-2">
              <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Only entities matching active officer authorization are rendered in this view.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
