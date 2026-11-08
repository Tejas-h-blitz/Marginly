import React, { useState } from 'react';
import { UsageSummary } from '../../types/index.js';

interface DataQualityStripProps {
  untimestampedRequests: number;
  unpricedModels: UsageSummary['unpricedModels'];
  month: string;
}

export const DataQualityStrip: React.FC<DataQualityStripProps> = ({
  untimestampedRequests,
  unpricedModels,
  month
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalUnpriced = unpricedModels.reduce((sum, model) => sum + model.requestCount, 0);
  const hasUntimestamped = untimestampedRequests > 0;
  const hasUnpriced = totalUnpriced > 0;

  if (!hasUntimestamped && !hasUnpriced) {
    return null;
  }

  // Construct single-line summary with counts
  let summaryText = '';
  if (hasUnpriced && hasUntimestamped) {
    summaryText = `${totalUnpriced.toLocaleString('en-US')} unpriced request${totalUnpriced === 1 ? '' : 's'} across ${unpricedModels.length} model${unpricedModels.length === 1 ? '' : 's'} • ${untimestampedRequests.toLocaleString('en-US')} record${untimestampedRequests === 1 ? '' : 's'} without timestamps`;
  } else if (hasUnpriced) {
    summaryText = `${totalUnpriced.toLocaleString('en-US')} request${totalUnpriced === 1 ? '' : 's'} excluded from cost totals (${unpricedModels.length} unknown model${unpricedModels.length === 1 ? '' : 's'})`;
  } else {
    summaryText = `${untimestampedRequests.toLocaleString('en-US')} record${untimestampedRequests === 1 ? '' : 's'} have missing or invalid timestamps and appear only in All time`;
  }

  return (
    <section
      role="region"
      aria-label="Data quality notice"
      className="dashboard-enter rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-[#141518] px-4 py-3 text-xs shadow-xs transition-colors"
      style={{ animationDelay: '40ms' }}
    >
      {/* Single-line Header with Counts and Expand Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
            Data quality:
          </span>
          <span className="text-zinc-700 dark:text-zinc-300 font-mono tabular-nums">
            {summaryText}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          aria-expanded={isExpanded}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          <span>{isExpanded ? 'Hide details' : 'Details'}</span>
          <svg
            className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expandable Details Area */}
      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          {hasUnpriced && (
            <div className="space-y-2">
              <div className="text-zinc-800 dark:text-zinc-200 font-medium">
                Unpriced Models ({unpricedModels.length})
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                The following model names do not match any entry in the active pricing catalog. Token volume is tracked, but cost cannot be derived.
                {month !== 'all' && ' Margin is overstated for this month until pricing is configured.'}
              </p>
              <ul className="space-y-1.5 pt-1">
                {unpricedModels.map(model => (
                  <li
                    key={model.modelName}
                    className="flex items-center justify-between gap-4 py-1 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  >
                    <code className="font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all font-semibold">
                      {model.modelName}
                    </code>
                    <span className="font-mono tabular-nums text-zinc-600 dark:text-zinc-300 text-xs shrink-0">
                      {model.requestCount.toLocaleString('en-US')} request{model.requestCount === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasUntimestamped && (
            <div className="space-y-1.5 pt-1">
              <div className="text-zinc-800 dark:text-zinc-200 font-medium">
                Untimestamped Records
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {untimestampedRequests.toLocaleString('en-US')} record{untimestampedRequests === 1 ? '' : 's'} lack a valid ISO timestamp. Because Marginly buckets data strictly by UTC calendar month, untimestamped records are excluded from specific month filters and aggregated only in the All-time audit view.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

