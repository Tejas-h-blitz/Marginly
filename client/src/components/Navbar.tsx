import React from 'react';

interface NavbarProps {
  onLoadSample: () => void;
  onExportCsv: () => void;
  onOpenPricing: () => void;
  onClearData: () => void;
  loading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadSample,
  onExportCsv,
  onOpenPricing,
  onClearData,
  loading
}) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:px-6 bg-dark-card/70 backdrop-blur-md border border-dark-border rounded-2xl mb-7 shadow-lg">
      <div className="flex items-center gap-3.5 mb-4 md:mb-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-indigo to-blue-500 flex items-center justify-center shadow-lg shadow-brand-indigo/30">
          <svg className="w-6 h-6 stroke-white fill-none stroke-2" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="14" x2="23" y2="14" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="14" x2="4" y2="14" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            AI Usage Cost Tracker
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-brand-indigo/20 text-indigo-300 border border-brand-indigo/40">
              V0 Prototype
            </span>
          </h1>
          <p className="text-xs text-slate-400">Per-customer LLM spend analysis & margin protection for SaaS founders</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <button
          onClick={onLoadSample}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md shadow-emerald-950/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
          title="Load sample dataset with 8 fake customer accounts"
        >
          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Load Sample Data
        </button>

        <button
          onClick={onExportCsv}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-dark-surface hover:bg-slate-700/80 border border-dark-border text-slate-200 transition-all disabled:opacity-50 cursor-pointer"
          title="Export current cost breakdown as CSV"
        >
          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>

        <button
          onClick={onOpenPricing}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-dark-surface hover:bg-slate-700/80 border border-dark-border text-slate-200 transition-all cursor-pointer"
          title="View model pricing table"
        >
          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Pricing Rates
        </button>

        <button
          onClick={onClearData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
          title="Clear all recorded data"
        >
          <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Clear
        </button>
      </div>
    </header>
  );
};
