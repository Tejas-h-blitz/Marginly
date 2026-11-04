import React from 'react';
import { UsageSummary } from '../types/index.js';
import { formatPercent, formatUsd } from '../money.js';

interface KpiGridProps {
  summary: UsageSummary;
}

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'negative';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, detail, tone = 'default' }) => (
  <div className={`bg-white dark:bg-[#121316] border rounded-xl p-4 flex flex-col justify-between transition-colors ${
    tone === 'negative'
      ? 'border-rose-300 dark:border-rose-700/60'
      : 'border-zinc-200/90 dark:border-zinc-800/80'
  }`}>
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">{label}</div>
      <div className={`text-2xl font-semibold font-mono tabular-nums tracking-tight ${
        tone === 'negative' ? 'text-rose-700 dark:text-rose-300' : 'text-zinc-950 dark:text-zinc-50'
      }`}>{value}</div>
    </div>
    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-mono">{detail}</div>
  </div>
);

export const KpiGrid: React.FC<KpiGridProps> = ({ summary }) => {
  const formatTokens = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return value.toLocaleString();
  };
  const monthView = summary.month !== 'all';

  if (monthView) {
    return (
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Monthly Revenue"
          value={`$${formatUsd(summary.totalRevenueUsd, 2)}`}
          detail="Customers with revenue entered"
        />
        <MetricCard
          label="Total Priced Cost"
          value={`$${formatUsd(summary.totalCost)}`}
          detail={`${summary.pricedRequests.toLocaleString()} priced requests`}
        />
        <MetricCard
          label="Blended Margin"
          value={formatPercent(summary.blendedMarginPercent)}
          detail={summary.totalMarginUsd === null ? 'No revenue entered' : `$${formatUsd(summary.totalMarginUsd)} margin`}
          tone={summary.totalMarginUsd !== null && summary.totalMarginUsd.startsWith('-') ? 'negative' : 'default'}
        />
        <MetricCard
          label="Unprofitable Customers"
          value={summary.unprofitableCustomers.toLocaleString()}
          detail="Revenue is below priced cost"
          tone={summary.unprofitableCustomers > 0 ? 'negative' : 'default'}
        />
        <MetricCard
          label="Active Accounts"
          value={summary.totalCustomers.toLocaleString()}
          detail="Customer IDs tracked"
        />
        <MetricCard
          label="Token Volume"
          value={formatTokens(summary.totalTokens)}
          detail={`In ${formatTokens(summary.totalInputTokens)} • Out ${formatTokens(summary.totalOutputTokens)}`}
        />
        <MetricCard
          label="Avg Cost / Priced Req"
          value={`$${formatUsd(summary.avgCostPerRequest, 5)}`}
          detail="Priced requests only"
        />
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      <MetricCard
        label="Total LLM Cost"
        value={`$${formatUsd(summary.totalCost)}`}
        detail="Cumulative priced expenditure"
      />
      <MetricCard
        label="Top Customer"
        value={summary.topCustomer?.customerId ?? '—'}
        detail={summary.topCustomer ? `$${formatUsd(summary.topCustomer.cost)} total cost` : 'No accounts ingested'}
      />
      <MetricCard
        label="Active Accounts"
        value={summary.totalCustomers.toLocaleString()}
        detail="Customer IDs tracked"
      />
      <MetricCard
        label="Token Volume"
        value={formatTokens(summary.totalTokens)}
        detail={`In ${formatTokens(summary.totalInputTokens)} • Out ${formatTokens(summary.totalOutputTokens)}`}
      />
      <MetricCard
        label="Avg Cost / Priced Req"
        value={`$${formatUsd(summary.avgCostPerRequest, 5)}`}
        detail={`${summary.pricedRequests.toLocaleString()} priced requests`}
      />
    </section>
  );
};
