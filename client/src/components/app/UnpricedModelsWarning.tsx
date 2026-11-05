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
      className="dashboard-enter rounded-xl px-4 py-3 mb-4 border border-blue-300/80 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/25 text-blue-950 dark:text-blue-200"
      style={{ animationDelay: '85ms' }}
    >
      <h2 className="text-xs font-semibold">
        {totalUnpriced} request{totalUnpriced === 1 ? '' : 's'} excluded from cost totals because the model pricing is unknown.
      </h2>
      {month !== 'all' && (
        <p className="mt-1 text-xs">
          Margin is overstated for this month until pricing is added for these models.
        </p>
      )}
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
