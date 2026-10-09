import React from 'react';
import { UsageSummary } from '../types/index.js';

interface KpiGridProps {
  summary: UsageSummary;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ summary }) => {
  const formatTokens = (val: number): string => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
    return val.toLocaleString();
  };

  const avgCostPerReq = summary.totalRequests > 0
    ? (summary.totalCost / summary.totalRequests)
    : 0;

  const topCustomerSpendShare = summary.topCustomer && summary.totalCost > 0
    ? Math.round((summary.topCustomer.cost / summary.totalCost) * 100)
    : 0;

  const isWhaleDominant = topCustomerSpendShare >= 40;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {/* 1. Total LLM Cost */}
      <div className="bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total LLM Cost
            </span>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">USD</span>
          </div>
          <div className="text-2xl font-semibold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
            ${summary.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
          Cumulative gross expenditure
        </div>
      </div>

      {/* 2. Top Spender / The Whale */}
      <div className={`bg-white dark:bg-[#121316] border rounded-xl p-4 flex flex-col justify-between transition-colors ${
        isWhaleDominant
          ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/10'
          : 'border-zinc-200/90 dark:border-zinc-800/80'
      }`}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Top Customer
            </span>
            {isWhaleDominant && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
                {topCustomerSpendShare}% spend
              </span>
            )}
          </div>
          <div
            className="text-base font-semibold font-mono tracking-tight text-zinc-950 dark:text-zinc-50 truncate"
            title={summary.topCustomer ? summary.topCustomer.customerId : 'No data'}
          >
            {summary.topCustomer ? summary.topCustomer.customerId : '—'}
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-mono tabular-nums">
          {summary.topCustomer ? `$${summary.topCustomer.cost.toFixed(4)} total cost` : 'No accounts ingested'}
        </div>
      </div>

      {/* 3. Tracked Accounts */}
      <div className="bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Active Accounts
            </span>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Tenants</span>
          </div>
          <div className="text-2xl font-semibold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
            {summary.totalCustomers.toLocaleString()}
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
          Unique customer entities
        </div>
      </div>

      {/* 4. Token Ingestion Volume */}
      <div className="bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Token Volume
            </span>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Tokens</span>
          </div>
          <div className="text-2xl font-semibold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
            {formatTokens(summary.totalTokens)}
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-mono tabular-nums truncate">
          In: {formatTokens(summary.totalInputTokens)} • Out: {formatTokens(summary.totalOutputTokens)}
        </div>
      </div>

      {/* 5. Unit Economics (Average Request Cost) */}
      <div className="bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Avg Cost / Req
            </span>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Unit</span>
          </div>
          <div className="text-2xl font-semibold font-mono tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
            ${avgCostPerReq.toFixed(4)}
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-mono tabular-nums">
          Across {summary.totalRequests.toLocaleString()} logged calls
        </div>
      </div>
    </section>
  );
};
