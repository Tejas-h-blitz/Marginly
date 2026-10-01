import React from 'react';
import { CustomerBreakdown } from '../../types/index.js';

interface ConcentrationBannerProps {
  customers: CustomerBreakdown[];
  totalCost: number;
}

export const ConcentrationBanner: React.FC<ConcentrationBannerProps> = ({ customers, totalCost }) => {
  if (!customers || customers.length < 2 || totalCost <= 0) {
    return null;
  }

  // Calculate top 3 concentration
  const top3 = customers.slice(0, 3);
  const top3Cost = top3.reduce((sum, c) => sum + c.totalCost, 0);
  const concentrationPercent = Math.round((top3Cost / totalCost) * 100);

  const isHighConcentration = concentrationPercent >= 70;

  return (
    <div
      className={`rounded-2xl p-4 mb-7 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md transition-all ${
        isHighConcentration
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isHighConcentration ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {isHighConcentration ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider">
            {isHighConcentration ? 'Whale Concentration Risk Detected' : 'Diversified Unit Economics'}
          </div>
          <div className="text-xs opacity-90 mt-0.5">
            {isHighConcentration ? (
              <>
                Top {top3.length} accounts represent <strong>{concentrationPercent}%</strong> of your total token bill. Heavy accounts like <span className="font-mono font-bold text-white">{top3[0]?.customerId}</span> may require custom usage tiers.
              </>
            ) : (
              <>
                Your token expenditure is healthy and well-distributed across active customer accounts.
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right self-end sm:self-auto">
        <span
          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
            isHighConcentration
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}
        >
          {concentrationPercent}% Spend in Top 3
        </span>
      </div>
    </div>
  );
};
