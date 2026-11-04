import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#0c0d0f] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="max-w-sm">
            <a href="#top" className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-950">
                <svg className="h-4 w-4 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
              <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Marginly</span>
            </a>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Clear, customer-level visibility into LLM usage costs and SaaS margins.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
              Import-based analysis. No live provider ingestion.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium">
            <a href="#top" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
              Overview
            </a>
            <a href="#models" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
              Model rates
            </a>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-zinc-200/80 pt-4 text-[11px] text-zinc-400 dark:border-zinc-800/80 dark:text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Marginly</span>
          <span>LLM unit economics for SaaS founders</span>
        </div>
      </div>
    </footer>
  );
};
