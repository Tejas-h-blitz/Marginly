import React from 'react';
import { UsageSummary } from '../../types/index.js';

interface UnpricedModelsWarningProps {
  models: UsageSummary['unpricedModels'];
}

export const UnpricedModelsWarning: React.FC<UnpricedModelsWarningProps> = ({ models }) => {
  if (models.length === 0) return null;

  const totalUnpriced = models.reduce((sum, model) => sum + model.requestCount, 0);

  return (
    <section
      role="alert"
      className="rounded-xl px-4 py-3 mb-4 border border-amber-300 dark:border-amber-700/50 bg-amber-50/70 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200"
    >
      <h2 className="text-xs font-semibold">
        {totalUnpriced} request{totalUnpriced === 1 ? '' : 's'} excluded from cost totals because the model pricing is unknown.
      </h2>
      <ul className="mt-2 space-y-1">
        {models.map(model => (
          <li key={model.modelName} className="flex justify-between gap-4 text-xs">
            <code className="font-mono break-all">{model.modelName}</code>
            <span className="font-mono tabular-nums shrink-0">
              {model.requestCount} request{model.requestCount === 1 ? '' : 's'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
