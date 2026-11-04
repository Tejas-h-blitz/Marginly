import React from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Export your usage',
    description: 'Bring records with a customer ID, model name, and input/output token counts.'
  },
  {
    number: '02',
    title: 'Upload or paste',
    description: 'Import a CSV or JSON file, or paste your usage rows. No SDK or provider API key is needed.'
  },
  {
    number: '03',
    title: 'Review cost and margin',
    description: 'See priced spend by customer, add monthly revenue, and compare margin by month.'
  }
];

export const HowItWorks: React.FC = () => (
  <section id="how-it-works" className="landing-highlight-section landing-section-enter scroll-mt-24 border-b border-zinc-200/80 py-16 dark:border-zinc-800/80 sm:py-20">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">A simple import workflow</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">How it works</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Marginly analyzes the usage records you provide. It does not connect to your model providers.
        </p>
      </div>

      <ol className="mt-8 grid gap-3 md:grid-cols-3">
        {STEPS.map(step => (
          <li key={step.number} className="landing-card-enter landing-feature-card rounded-xl border border-zinc-200/90 bg-white/75 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-[#121316]/85" style={{ animationDelay: `${STEPS.indexOf(step) * 55}ms` }}>
            <span className="inline-flex h-7 min-w-8 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 font-mono text-[11px] text-zinc-500 dark:border-zinc-700/80 dark:bg-zinc-900/70 dark:text-zinc-400">{step.number}</span>
            <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{step.description}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid min-w-0 gap-4 rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/50 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Usage CSV columns</p>
          <pre className="mt-2 max-w-full overflow-x-auto rounded-lg border border-zinc-200 bg-white p-3 font-mono text-[11px] leading-5 text-zinc-700 dark:border-zinc-800 dark:bg-[#0c0d0f] dark:text-zinc-300"><code>{`customer_id,timestamp,model_name,input_tokens,output_tokens
acct_001,2026-10-01T12:00:00Z,gpt-4o,1000,250`}</code></pre>
        </div>
        <a
          href="/usage-template.csv"
          download
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Download CSV template
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </div>
  </section>
);
