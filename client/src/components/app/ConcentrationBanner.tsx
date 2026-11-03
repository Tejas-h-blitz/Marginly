import React from 'react';
import { CustomerBreakdown } from '../../types/index.js';

interface ConcentrationBannerProps {
  customers: CustomerBreakdown[];
  totalCost: number;
}

export const ConcentrationBanner: React.FC<ConcentrationBannerProps> = ({ customers, totalCost }) => {
  if (!customers || customers.length < 8 || totalCost <= 0) {
    return null;
  }

  // Calculate top 3 concentration
  const top3 = customers.slice(0, 3);
  const top3Cost = top3.reduce((sum, c) => sum + c.totalCost, 0);
  const rawShare = totalCost > 0 ? (top3Cost / totalCost) * 100 : 0;

  // Format exact share: never rounded up to 100% unless mathematically >= 100%
  const formattedShare = rawShare >= 100
    ? '100%'
    : rawShare >= 99.95
    ? '99.9%'
    : `${Number(rawShare.toFixed(1))}%`;

  const top1Share = top3[0] && totalCost > 0 ? (top3[0].totalCost / totalCost) * 100 : 0;
  const formattedTop1Share = top1Share >= 100
    ? '100%'
    : top1Share >= 99.95
    ? '99.9%'
    : `${Number(top1Share.toFixed(1))}%`;

  const isHighConcentration = rawShare >= 70;

  return (
    <div
      className={`rounded-xl px-4 py-3 mb-6 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
        isHighConcentration
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
          : 'bg-zinc-100/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono ${
            isHighConcentration
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          {isHighConcentration ? '!' : 'i'}
        </div>

        <div>
          <div className="text-xs font-semibold tracking-tight">
            {isHighConcentration ? 'Whale Concentration Risk Detected' : 'Unit Economics Distribution'}
          </div>
          <div className="text-xs opacity-90 mt-0.5">
            {isHighConcentration ? (
              <>
                Top {top3.length} accounts consume <strong>{formattedShare}</strong> of your total token bill. Account <span className="font-mono font-bold">{top3[0]?.customerId}</span> accounts for {formattedTop1Share} of total spend.
              </>
            ) : (
              <>
                Token expenditure is diversified. Top {top3.length} accounts represent <strong>{formattedShare}</strong> of total spend.
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 self-end sm:self-auto">
        <span
          className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border tabular-nums ${
            isHighConcentration
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/40'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60'
          }`}
        >
          {formattedShare} spend in Top 3
        </span>
      </div>
    </div>
  );
};
