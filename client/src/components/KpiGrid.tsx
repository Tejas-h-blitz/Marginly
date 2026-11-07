import React from 'react';
import { UsageSummary } from '../types/index.js';
import { formatPercent, formatUsd } from '../money.js';
import { useCardSpotlight, useCountUp } from '../hooks/useUiEffects.js';

interface KpiGridProps {
  summary: UsageSummary;
}

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'positive' | 'negative';
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, detail, tone = 'default', icon }) => {
  const { onMouseMove } = useCardSpotlight();
  const animatedValue = useCountUp(value);
  return (
    <div
      onMouseMove={onMouseMove}
      className={`surface-card bg-white dark:bg-[#121316] border rounded-xl p-4 sm:p-4.5 flex flex-col justify-between shadow-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700/80 ${
        tone === 'negative'
          ? 'border-amber-300/80 dark:border-amber-700/60 bg-amber-500/[0.02]'
          : tone === 'positive'
          ? 'border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-500/[0.02]'
          : 'border-zinc-200/90 dark:border-zinc-800/80'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
          {icon && (
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
              tone === 'negative'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                : tone === 'positive'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            }`}>
              {icon}
            </div>
          )}
        </div>
        <div className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
          tone === 'negative'
            ? 'text-amber-800 dark:text-amber-300'
            : tone === 'positive'
            ? 'text-emerald-800 dark:text-emerald-300'
            : 'text-zinc-950 dark:text-zinc-50'
        }`}>
          {animatedValue}
        </div>
      </div>
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2.5 font-mono flex items-center gap-1.5">
        <span className="truncate">{detail}</span>
      </div>
    </div>
  );
};

export const KpiGrid: React.FC<KpiGridProps> = ({ summary }) => {
  const formatTokens = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return value.toLocaleString();
  };
  const monthView = summary.month !== 'all';

  if (monthView) {
    const isNegativeMargin = summary.totalMarginUsd !== null && summary.totalMarginUsd.startsWith('-');
    const isHealthyMargin = summary.blendedMarginPercent !== null && Number(summary.blendedMarginPercent) >= 70;

    return (
      <section className="dashboard-enter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6" style={{ animationDelay: '65ms' }}>
        <MetricCard
          label="Monthly Revenue"
          value={`$${formatUsd(summary.totalRevenueUsd, 2)}`}
          detail="Customers with revenue entered"
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Total Priced Cost"
          value={`$${formatUsd(summary.totalCost)}`}
          detail={`${summary.pricedRequests.toLocaleString()} priced requests`}
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
        <MetricCard
          label="Blended Margin"
          value={formatPercent(summary.blendedMarginPercent)}
          detail={summary.totalMarginUsd === null ? 'No revenue entered' : `$${formatUsd(summary.totalMarginUsd)} margin`}
          tone={isNegativeMargin ? 'negative' : isHealthyMargin ? 'positive' : 'default'}
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <MetricCard
          label="Unprofitable Accounts"
          value={summary.unprofitableCustomers.toLocaleString()}
          detail="Revenue is below priced cost"
          tone={summary.unprofitableCustomers > 0 ? 'negative' : 'default'}
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <MetricCard
          label="Active Accounts"
          value={summary.totalCustomers.toLocaleString()}
          detail="Customer IDs tracked"
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Token Volume"
          value={formatTokens(summary.totalTokens)}
          detail={`In ${formatTokens(summary.totalInputTokens)} • Out ${formatTokens(summary.totalOutputTokens)}`}
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <MetricCard
          label="Avg Cost / Priced Req"
          value={`$${formatUsd(summary.avgCostPerRequest, 5)}`}
          detail="Priced requests only"
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
      </section>
    );
  }

  return (
    <section className="dashboard-enter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6" style={{ animationDelay: '65ms' }}>
      <MetricCard
        label="Total LLM Cost"
        value={`$${formatUsd(summary.totalCost)}`}
        detail="Cumulative priced expenditure"
        icon={
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        }
      />
      <MetricCard
        label="Top Customer"
        value={summary.topCustomer?.customerId ?? '—'}
        detail={summary.topCustomer ? `$${formatUsd(summary.topCustomer.cost)} total cost` : 'No accounts ingested'}
        icon={
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        }
      />
      <MetricCard
        label="Active Accounts"
        value={summary.totalCustomers.toLocaleString()}
        detail="Customer IDs tracked"
        icon={
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />
      <MetricCard
        label="Token Volume"
        value={formatTokens(summary.totalTokens)}
        detail={`In ${formatTokens(summary.totalInputTokens)} • Out ${formatTokens(summary.totalOutputTokens)}`}
        icon={
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
      <MetricCard
        label="Avg Cost / Priced Req"
        value={`$${formatUsd(summary.avgCostPerRequest, 5)}`}
        detail={`${summary.pricedRequests.toLocaleString()} priced requests`}
        icon={
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
      />
    </section>
  );
};
