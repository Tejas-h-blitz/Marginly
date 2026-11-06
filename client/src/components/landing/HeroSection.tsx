import React, { useMemo, useState } from 'react';
import { rangeProgressStyle } from '../../hooks/useUiEffects.js';
import { LANDING_MODEL_CATALOG, LANDING_MODEL_GROUPS } from './modelCatalog.js';

interface HeroSectionProps {
  onLaunchApp: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLaunchApp }) => {
  const [monthlyRevenue, setMonthlyRevenue] = useState(49);
  const [tokenUsageK, setTokenUsageK] = useState(2500);
  const [selectedModelName, setSelectedModelName] = useState(LANDING_MODEL_CATALOG[0].modelName);
  const selectedModel = useMemo(
    () => LANDING_MODEL_CATALOG.find(model => model.modelName === selectedModelName) ?? LANDING_MODEL_CATALOG[0],
    [selectedModelName]
  );
  const estimatedCost = tokenUsageK * (
    selectedModel.costPer1kInput + selectedModel.costPer1kOutput
  ) / 2;
  const estimatedMargin = monthlyRevenue - estimatedCost;
  const marginPercent = monthlyRevenue > 0 ? Math.round((estimatedMargin / monthlyRevenue) * 100) : 0;
  const unprofitable = estimatedMargin < 0;

  const scrollToHowItWorks = () => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    document.getElementById('how-it-works')?.scrollIntoView({ behavior, block: 'start' });
  };

  return (
    <section id="top" className="landing-hero relative isolate overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80">
      <div className="landing-hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mx-auto grid min-h-[min(900px,calc(100svh-4rem))] max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.12fr_0.88fr] lg:gap-14 lg:py-20">
        <div className="hero-enter max-w-xl text-left">
          <h1 className="hero-title text-left text-[2rem] font-semibold leading-[1.16] tracking-[-0.03em] text-zinc-950 dark:text-zinc-50 sm:text-[2.5rem] lg:text-[3.25rem]">
            See which customers cost you the most in LLM tokens.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base sm:leading-7">
            Upload your usage logs, add what each customer pays, and see who&apos;s costing you money. No SDK, no API keys.
          </p>
          <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={onLaunchApp}
              className="interaction-button inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white sm:w-auto"
            >
              Upload your usage CSV
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2.5 text-[13px] font-medium text-zinc-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:w-auto"
            >
              See how it works
            </button>
            <span className="inline-flex rounded-full border border-zinc-200 bg-white/70 px-2.5 py-1 text-[10px] font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
              Free during early access
            </span>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
            <li>CSV upload or paste</li>
            <li>Monthly margin view</li>
            <li>Exportable reports</li>
          </ul>
        </div>

        <div className="hero-enter w-full" style={{ animationDelay: '90ms' }}>
          <div className="surface-card rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-[#121316] sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <h2 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Margin simulator</h2>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Illustrative example, not your data</p>
              </div>
              <span className="rounded-md border border-zinc-200 px-2 py-1 font-mono text-[9px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                USD / month
              </span>
            </div>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-4 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span>Customer monthly revenue</span>
                  <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">${monthlyRevenue}</span>
                </span>
                <input
                  type="range"
                  min="15"
                  max="199"
                  step="1"
                  value={monthlyRevenue}
                  aria-label="Customer monthly revenue"
                  onChange={event => setMonthlyRevenue(Number(event.target.value))}
                  style={rangeProgressStyle(monthlyRevenue, 15, 199)}
                  className="w-full cursor-pointer rounded-lg"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-4 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span>Monthly text token volume</span>
                  <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{(tokenUsageK / 1000).toFixed(1)}M</span>
                </span>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={tokenUsageK}
                  aria-label="Monthly text token volume"
                  onChange={event => setTokenUsageK(Number(event.target.value))}
                  style={rangeProgressStyle(tokenUsageK, 100, 10000)}
                  className="w-full cursor-pointer rounded-lg"
                />
              </label>

              <label className="block text-[11px] text-zinc-600 dark:text-zinc-400">
                Model
                <select
                  value={selectedModelName}
                  onChange={event => setSelectedModelName(event.target.value)}
                  className="mt-1.5 block min-h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {LANDING_MODEL_GROUPS.map(group => (
                    <optgroup key={group.provider} label={group.provider}>
                      {group.models.map(model => (
                        <option key={model.modelName} value={model.modelName}>{model.displayName}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-zinc-500">Revenue</div>
                    <div className="mt-1 font-mono text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">${monthlyRevenue}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Est. model cost</div>
                    <div className="mt-1 font-mono text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">${estimatedCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Est. margin</div>
                    <div className={`mt-1 font-mono text-[13px] font-semibold tabular-nums ${unprofitable ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                      {marginPercent}%
                    </div>
                  </div>
                </div>
                <p className="mt-3 border-t border-zinc-200 pt-2 text-center text-[10px] leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  Estimate assumes an even split of input and output tokens. Rates are for text tokens only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
