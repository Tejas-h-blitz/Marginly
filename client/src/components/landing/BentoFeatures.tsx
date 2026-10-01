import React from 'react';

export const BentoFeatures: React.FC = () => {
  return (
    <section id="features" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
            Engineered for SaaS Resilience
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything You Need to Protect LLM Profitability
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Turn unpredictable token expenses into clear, accountable per-customer unit economics.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Card 1: Whale Customer Detection (Wide 7 cols) */}
          <div className="md:col-span-7 rounded-3xl bg-slate-900/70 border border-white/[0.08] hover:border-emerald-500/30 p-7 sm:p-8 backdrop-blur-xl transition-all duration-300 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 stroke-emerald-400 fill-none stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Whale Customer Detection</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              In almost every AI SaaS, 10% of heavy accounts consume over 80% of all LLM tokens. Marginly ranks accounts by expenditure so you can renegotiate custom enterprise tiers before you lose money.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 font-mono text-xs text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Concentration Insight:</span>
              <span className="text-emerald-400 font-semibold">Top 3 accounts = 93.8% total spend</span>
            </div>
          </div>

          {/* Card 2: Gross Margin Sentinel (5 cols) */}
          <div className="md:col-span-5 rounded-3xl bg-slate-900/70 border border-white/[0.08] hover:border-cyan-500/30 p-7 sm:p-8 backdrop-blur-xl transition-all duration-300 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 stroke-cyan-400 fill-none stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Gross Margin Sentinel</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Avoid subsidizing power users. Highlight accounts consuming more in API tokens than their subscription revenue.
            </p>
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 font-mono text-xs text-rose-300 flex items-center justify-between">
              <span>cust_heavy_ai:</span>
              <span className="font-bold">-$14.50 (Negative Margin)</span>
            </div>
          </div>

          {/* Card 3: Multi-Model Intelligence (5 cols) */}
          <div className="md:col-span-5 rounded-3xl bg-slate-900/70 border border-white/[0.08] hover:border-indigo-500/30 p-7 sm:p-8 backdrop-blur-xl transition-all duration-300 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 stroke-indigo-400 fill-none stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Multi-Model Intelligence</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Always up to date with 15+ models across OpenAI and Anthropic. Correctly splits prompt tokens and completion tokens at distinct cost rates.
            </p>
            <div className="flex gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">GPT-4o</span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Claude 3.5</span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">Mini</span>
            </div>
          </div>

          {/* Card 4: Zero-Lockin Ingestion (7 cols) */}
          <div className="md:col-span-7 rounded-3xl bg-slate-900/70 border border-white/[0.08] hover:border-teal-500/30 p-7 sm:p-8 backdrop-blur-xl transition-all duration-300 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 stroke-teal-400 fill-none stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Zero-Lockin Flexible Ingestion</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Drop raw CSV files, paste JSON logs, or point your webhook. Powered by Prisma with PostgreSQL storage, allowing seamless export to CSV for your finance and accounting teams.
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5 text-slate-300">Drag &amp; Drop CSV</div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5 text-slate-300">Paste Raw JSON</div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5 text-slate-300">Export Reports</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
