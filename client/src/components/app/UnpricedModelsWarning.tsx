import React from 'react';
import { UsageSummary } from '../../types/index.js';

interface UnpricedModelsWarningProps {
  models: UsageSummary['unpricedModels'];
  month: string;
}

export const UnpricedModelsWarning: React.FC<UnpricedModelsWarningProps> = ({ models, month }) => {
  if (models.length === 0) return null;

  const totalUnpriced = models.reduce((sum, model) => sum + model.requestCount, 0);

  return (
    <section
      role="alert"
      className="dashboard-enter rounded-xl px-4 py-3.5 mb-4 border border-zinc-200 dark:border-zinc-800/90 bg-zinc-50/80 dark:bg-[#141518] text-zinc-900 dark:text-zinc-100 shadow-xs"
      style={{ animationDelay: '85ms' }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-5 h-5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-zinc-600 dark:text-zinc-300">
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-white">
            {totalUnpriced} request{totalUnpriced === 1 ? '' : 's'} excluded from cost totals because the model pricing is unknown.
          </h2>
          {month !== 'all' && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              Margin is overstated for this month until pricing is added for these models.
            </p>
          )}
          <ul className="mt-2.5 space-y-1.5 border-t border-zinc-200/60 dark:border-zinc-800/80 pt-2">
            {models.map(model => (
              <li key={model.modelName} className="flex items-center justify-between gap-4 text-xs">
                <code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 break-all">
                  {model.modelName}
                </code>
                <span className="font-mono tabular-nums text-zinc-500 dark:text-zinc-400 text-[11px] shrink-0">
                  {model.requestCount} request{model.requestCount === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
