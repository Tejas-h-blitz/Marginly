import React from 'react';
import { BrandLogo } from '../BrandLogo.js';

interface FooterProps {
  feedbackHref: string | null;
}

export const Footer: React.FC<FooterProps> = ({ feedbackHref }) => (
  <footer className="border-t border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-[#0c0d0f] transition-colors">
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <a
            href="#top"
            aria-label="Marginly home"
            className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <BrandLogo className="w-[100px]" />
          </a>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Customer-level cost analysis from imported usage logs.
          </p>
        </div>

        <div className="flex items-center gap-5 text-xs">
          {feedbackHref && (
            <a
              href={feedbackHref}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              Give feedback
            </a>
          )}
          <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
            &copy; 2026 Marginly
          </span>
        </div>
      </div>
    </div>
  </footer>
);
