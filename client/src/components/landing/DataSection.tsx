import React from 'react';

const STORED_FIELDS = [
  'Customer IDs',
  'Model names',
  'Input and output token counts',
  'Timestamps, when provided and valid',
  'Monthly revenue, if you add it'
];

export const DataSection: React.FC = () => (
  <section id="your-data" className="landing-highlight-section landing-section-enter scroll-mt-24 border-b border-zinc-200/80 py-16 dark:border-zinc-800/80 sm:py-20">
    <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Keep imports focused</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">Your data</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Use anonymized customer IDs instead of names or email addresses.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200/90 bg-white p-5 dark:border-zinc-800/80 dark:bg-[#121316]">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Stored for analysis</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
            {STORED_FIELDS.map(field => <li key={field} className="flex gap-2"><span className="text-zinc-400" aria-hidden="true">·</span>{field}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-200/90 bg-white p-5 dark:border-zinc-800/80 dark:bg-[#121316]">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Not stored</h3>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Prompts and model responses are not stored as usage records. The importer saves customer identifiers, model names, token counts, and timestamps—not prompt or response text.
          </p>
        </div>
      </div>
      <p className="md:col-start-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Clear removes your stored usage records and customer records from Marginly.
      </p>
    </div>
  </section>
);
