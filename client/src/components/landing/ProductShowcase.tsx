import React from 'react';

interface ProductShowcaseProps {
  onLaunchApp: () => void;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({ onLaunchApp }) => {
  return (
    <section id="showcase" className="py-12 sm:py-16 border-t border-zinc-200/80 dark:border-zinc-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            A precise audit dashboard for SaaS unit economics
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Instantly see which customer accounts drive the majority of your token bill and export audit-ready CSV reports.
          </p>
        </div>

        {/* Dashboard Preview Window Mockup */}
        <div className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 shadow-md p-4 sm:p-6 transition-colors">
          
          {/* Top Window Bar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="font-mono text-zinc-400 dark:text-zinc-500 text-[11px] ml-1">
                marginly.app/dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onLaunchApp}
                className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-md transition-colors"
              >
                Open Dashboard →
              </button>
            </div>
          </div>

          {/* Mock KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 font-mono">
            <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-3">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total LLM Cost</div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">$3,842.50</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">USD gross</div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-3">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Customers</div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">14 accounts</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Tracked tenants</div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-3">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Tokens Processed</div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">18.4M</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Input + Output</div>
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3">
              <div className="text-[10px] text-amber-700 dark:text-amber-400 uppercase tracking-wider">Top Spender</div>
              <div className="text-lg font-semibold text-amber-900 dark:text-amber-200 mt-0.5 truncate">cust_acme</div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 tabular-nums">44.6% of total spend</div>
            </div>
          </div>

          {/* Visual Distribution Mockup Bar */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Customer Cost Concentration
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                Sorted by spend descending
              </span>
            </div>
            
            {/* Visual Sample Bars */}
            <div className="space-y-2 font-mono text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium">cust_acme_enterprise</span>
                  <span className="text-amber-700 dark:text-amber-300 font-semibold tabular-nums">$1,626.00 (44.6%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '44.6%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-700 dark:text-zinc-300">cust_legal_doc_ai</span>
                  <span className="text-zinc-600 dark:text-zinc-400 tabular-nums">$1,043.00 (28.6%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full" style={{ width: '28.6%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-700 dark:text-zinc-300">cust_fintech_bot</span>
                  <span className="text-zinc-600 dark:text-zinc-400 tabular-nums">$749.60 (20.6%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full" style={{ width: '20.6%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive CTA */}
          <div className="text-center pt-2">
            <button
              onClick={onLaunchApp}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:underline underline-offset-4"
            >
              <span>Explore live with pre-loaded demo data</span>
              <span className="font-mono">→</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
