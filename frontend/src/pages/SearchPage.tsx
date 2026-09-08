import React, { useState } from 'react';
import { Search, Sparkles, FileText, Lock, ArrowRight, ShieldCheck, Filter } from 'lucide-react';
import { api } from '../api/client';

interface SearchPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('Find investigation documents related to vehicle evidence in Case 104');
  const [results, setResults] = useState<any[]>([]);
  const [parsedIntent, setParsedIntent] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await api.get<any>(`/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(res.results || []);
      setParsedIntent(res.parsedIntent || null);
    } catch (err: any) {
      alert(`Search failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch(query);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-extrabold text-white">Smart Search & Natural Language Query</h1>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Full-Text OCR Matching • Semantic Intent Parsing • Strict Multi-Layered Clearance Enforcement
        </p>
      </div>

      {/* Query Bar */}
      <div className="p-4 rounded-2xl bg-[#0e1629] border border-cyan-500/30 shadow-xl space-y-3">
        <div className="relative flex items-center">
          <Sparkles className="w-5 h-5 text-cyan-400 absolute left-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything (e.g. Find investigation reports related to vehicle evidence in Case 104)"
            className="w-full pl-12 pr-28 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans shadow-inner"
          />
          <button
            onClick={() => executeSearch(query)}
            disabled={isSearching}
            className="absolute right-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Suggested Queries */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[10px] uppercase font-bold">Suggested:</span>
          {[
            'Find investigation documents related to vehicle evidence in Case 104',
            'FIR report for Case 104',
            'Forensic lab chip dump in Sector 62',
            'Court Order search warrant',
          ].map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(sample);
                executeSearch(sample);
              }}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 text-slate-300 hover:text-cyan-300 font-mono text-[11px] transition"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Parsed Natural Language Intent Card */}
      {parsedIntent && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono flex flex-wrap items-center gap-4 text-slate-300">
          <div className="text-cyan-400 font-bold flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Parsed Natural Language Intent:</span>
          </div>
          {parsedIntent.inferredCase && (
            <div className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              Case: #{parsedIntent.inferredCase}
            </div>
          )}
          {parsedIntent.inferredClassification && (
            <div className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
              Type: {parsedIntent.inferredClassification}
            </div>
          )}
          {parsedIntent.keywords && parsedIntent.keywords.length > 0 && (
            <div className="text-slate-400">
              Keywords: <span className="text-slate-200">{parsedIntent.keywords.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Search Results Catalog */}
      <div className="space-y-4">
        {hasSearched && (
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Found {results.length} authorized documents matching criteria</span>
            <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero Leakage: Unauthorized documents withheld</span>
            </span>
          </div>
        )}

        {results.length === 0 && hasSearched ? (
          <div className="p-12 text-center rounded-2xl bg-[#0e1629] border border-slate-800 space-y-2">
            <Search className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No authorized records match your query.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ensure you have clearance for the requested case or verify the document classification.
            </p>
          </div>
        ) : (
          results.map((r) => (
            <div
              key={r.id}
              onClick={() => onNavigate('document-detail', r.id)}
              className="p-5 rounded-2xl bg-[#0e1629] border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition shadow-xl space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                    {r.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {r.aiClassification}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {r.sensitivityLevel}
                </span>
              </div>

              {/* Snippet from OCR text */}
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{r.snippet || r.summary}</p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{r.caseNumber} • {r.caseTitle}</span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition flex items-center space-x-1">
                  <span>Inspect Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
