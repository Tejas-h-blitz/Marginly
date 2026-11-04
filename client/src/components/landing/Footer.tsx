import React from 'react';

interface FooterProps {
  feedbackHref: string | null;
}

export const Footer: React.FC<FooterProps> = ({ feedbackHref }) => (
  <footer className="border-t border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-[#0c0d0f]">
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <a href="#top" className="inline-flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-950" aria-hidden="true">
              <svg className="h-4 w-4 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
            Marginly
          </a>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Customer-level cost analysis from imported usage logs.</p>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-3 text-xs">
          <a href="#how-it-works" className="text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-100">How it works</a>
          <a href="#models" className="text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-100">Supported models</a>
          <a href="#your-data" className="text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-100">Your data</a>
          {feedbackHref && (
            <a href={feedbackHref} className="text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-100">Give feedback</a>
          )}
        </nav>
      </div>
      <div className="mt-7 border-t border-zinc-200/80 pt-4 text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
        © {new Date().getFullYear()} Marginly
      </div>
    </div>
  </footer>
);
