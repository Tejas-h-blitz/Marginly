import React, { useState } from 'react';
import { LANDING_MODEL_CATALOG, LANDING_MODEL_GROUPS } from './modelCatalog.js';

type ProviderFilter = 'All' | string;

const formatRate = (rate: number) => `$${rate.toFixed(5)}`;

export const ModelRateTicker: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<ProviderFilter>('All');
  const providers = LANDING_MODEL_GROUPS.map(group => group.provider);
  const models = activeFilter === 'All'
    ? LANDING_MODEL_CATALOG
    : LANDING_MODEL_CATALOG.filter(model => model.provider === activeFilter);

  return (
    <section id="models" className="landing-section-enter scroll-mt-24 border-b border-zinc-200/80 bg-zinc-50/60 py-16 dark:border-zinc-800/80 dark:bg-[#0e0f12]/60 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Supported models</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">Model list rates</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Rates are USD per 1,000 text tokens, with separate input and output prices. These are list-rate estimates, not a provider invoice.
            </p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900" aria-label="Filter models by provider">
            {(['All', ...providers] as const).map(provider => (
              <button
                key={provider}
                type="button"
                aria-pressed={activeFilter === provider}
                onClick={() => setActiveFilter(provider)}
                className={`min-h-8 rounded-md px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                  activeFilter === provider
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model, index) => (
            <li key={model.modelName} className="landing-card-enter landing-feature-card rounded-xl border border-zinc-200/90 bg-white p-4 dark:border-zinc-800/80 dark:bg-[#121316]" style={{ animationDelay: `${(index % 12) * 25}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">{model.displayName}</h3>
                <span className="shrink-0 rounded-md border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">{model.provider}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-3 font-mono dark:border-zinc-800">
                <div>
                  <dt className="text-[10px] text-zinc-500">Input / 1k</dt>
                  <dd className="mt-1 text-xs tabular-nums text-zinc-800 dark:text-zinc-200">{formatRate(model.costPer1kInput)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-zinc-500">Output / 1k</dt>
                  <dd className="mt-1 text-xs tabular-nums text-zinc-800 dark:text-zinc-200">{formatRate(model.costPer1kOutput)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
          Text token rates only. Audio, image, and video pricing is not represented; model rates may change over time.
        </p>
      </div>
    </section>
  );
};
