import React from 'react';
import { CustomerBreakdown } from '../../types/index.js';
import { addDecimalStrings, compareMoney, formatPercent } from '../../money.js';

interface ConcentrationBannerProps {
  customers: CustomerBreakdown[];
  totalCost: string;
}

export const ConcentrationBanner: React.FC<ConcentrationBannerProps> = ({ customers, totalCost }) => {
  if (!customers || customers.length < 8 || compareMoney(totalCost, '0') <= 0) {
    return null;
  }

  // Calculate top 3 concentration
  const top3 = customers.slice(0, 3);
  const rawShare = top3.reduce(
    (sum, customer) => addDecimalStrings(sum, customer.percentOfTotal),
    '0'
  );

  // Format exact share: never rounded up to 100% unless mathematically >= 100%
  const formattedShare = compareMoney(rawShare, '100') >= 0
    ? '100%'
    : compareMoney(rawShare, '99.95') >= 0
    ? '99.9%'
    : formatPercent(rawShare);

  const top1Share = top3[0]?.percentOfTotal ?? '0';
  const formattedTop1Share = compareMoney(top1Share, '100') >= 0
    ? '100%'
    : compareMoney(top1Share, '99.95') >= 0
    ? '99.9%'
    : formatPercent(top1Share);

  const isHighConcentration = compareMoney(rawShare, '70') >= 0;

  return (
    <div
      className="dashboard-enter rounded-xl px-4 py-3 mb-6 border border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-[#141518] text-zinc-900 dark:text-zinc-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      style={{ animationDelay: '55ms' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0 text-xs font-mono font-bold border border-zinc-300/80 dark:border-zinc-700/60">
          {isHighConcentration ? '!' : 'i'}
        </div>

        <div>
          <div className="text-xs font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {isHighConcentration ? 'Whale Concentration Risk Detected' : 'Unit Economics Distribution'}
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-normal">
            {isHighConcentration ? (
              <>
                Top {top3.length} accounts consume <strong className="text-zinc-900 dark:text-zinc-100">{formattedShare}</strong> of your total spend in this period. Account <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{top3[0]?.customerId}</span> accounts for {formattedTop1Share} of total spend.
              </>
            ) : (
              <>
                Token expenditure is diversified. Top {top3.length} accounts represent <strong className="text-zinc-900 dark:text-zinc-100">{formattedShare}</strong> of total spend.
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 self-end sm:self-auto">
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md border tabular-nums bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700/80 shadow-xs">
          {formattedShare} spend in Top 3
        </span>
      </div>
    </div>
  );
};
