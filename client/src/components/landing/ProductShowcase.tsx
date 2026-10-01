import React from 'react';

interface ProductShowcaseProps {
  onLaunchApp: () => void;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({ onLaunchApp }) => {
  return (
    <section id="showcase" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Interactive Command Center
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed for Founders Who Value Unit Economics
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Instantly see who is driving 80% of your OpenAI and Anthropic bills, evaluate pricing plans, and export audit-ready CSV reports in seconds.
          </p>
        </div>

        {/* Dashboard Preview Window Mockup */}
        <div className="relative mx-auto max-w-5xl rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl p-4 sm:p-6 backdrop-blur-2xl group hover:border-emerald-500/30 transition-all duration-500">
          
          {/* Top Window Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <div className="h-4 w-px bg-white/10 mx-2" />
              <span className="text-xs font-mono text-slate-400">marginly.app/dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL Connected
              </span>
              <button
                onClick={onLaunchApp}
                className="text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-3 py-1 rounded-lg transition-all"
              >
                Open Live
              </button>
            </div>
          </div>

          {/* Mock KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total LLM Spend</div>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">$3,842.50</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">↑ 49 requests analyzed</div>
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Customers</div>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">14 accounts</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Top: cust_acme (44%)</div>
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Tokens Processed</div>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">18.4M</div>
              <div className="text-[11px] text-cyan-400 mt-0.5">Prompt + Generation</div>
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Avg Margin Health</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">78.4%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">2 accounts flagged</div>
            </div>
          </div>

          {/* Visual Distribution Mockup Bar */}
          <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 mb-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-200">Customer Cost Concentration (Recharts)</span>
              <span className="text-[11px] font-mono text-slate-400">Sorted by spend descending</span>
            </div>
            
            {/* Visual Sample Bars */}
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-rose-400 font-semibold">cust_acme_enterprise</span>
                  <span className="text-white font-bold">$1,626.00 (44.6%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full" style={{ width: '44.6%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-indigo-400 font-semibold">cust_legal_doc_ai</span>
                  <span className="text-white font-bold">$1,043.00 (28.6%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full" style={{ width: '28.6%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-cyan-400 font-semibold">cust_fintech_bot</span>
                  <span className="text-white font-bold">$749.60 (20.6%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" style={{ width: '20.6%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive CTA overlay */}
          <div className="pt-2 text-center">
            <button
              onClick={onLaunchApp}
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Explore the full interactive dashboard live</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
