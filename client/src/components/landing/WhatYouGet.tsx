import React from 'react';

const OUTPUTS = [
  {
    title: 'Cost per customer',
    description: 'Compare priced usage costs across your customer IDs.'
  },
  {
    title: 'Spend share',
    description: 'See how much of total priced cost each customer represents.'
  },
  {
    title: 'Concentration flag',
    description: 'Spot when a small number of customers account for most priced spend.'
  },
  {
    title: 'Unpriced-model warning',
    description: 'See unknown model names and request counts instead of guessed costs.'
  },
  {
    title: 'Monthly margin and CSV export',
    description: 'Add monthly revenue, compare it with priced costs, and export a customer breakdown.'
  }
];

export const WhatYouGet: React.FC = () => (
  <section id="features" className="landing-highlight-section landing-section-enter scroll-mt-24 border-b border-zinc-200/80 py-16 dark:border-zinc-800/80 sm:py-20">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Useful outputs, no guesswork</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">What you get</h2>
      </div>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {OUTPUTS.map((output, index) => (
          <li key={output.title} className="landing-card-enter landing-feature-card rounded-xl border border-zinc-200/90 bg-white p-5 dark:border-zinc-800/80 dark:bg-[#121316]" style={{ animationDelay: `${index * 55}ms` }}>
            <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">0{index + 1}</span>
            <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{output.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{output.description}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
