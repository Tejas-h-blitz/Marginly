import React from 'react';
import { UsageSummary } from '../types/index.js';

interface KpiGridProps {
  summary: UsageSummary;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ summary }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-7">
      {/* Total Spend */}
      <div className="bg-dark-card border border-dark-border hover:border-slate-700/80 rounded-xl p-5 relative overflow-hidden transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-indigo" />
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <span>Total LLM Cost</span>
          <svg className="w-4 h-4 stroke-indigo-400 fill-none stroke-2" viewBox="0 0 24 24">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-white mb-1">
          ${summary.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </div>
        <div className="text-xs text-slate-500">Calculated API expenditure</div>
      </div>

      {/* Customers */}
      <div className="bg-dark-card border border-dark-border hover:border-slate-700/80 rounded-xl p-5 relative overflow-hidden transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <span>Tracked Customers</span>
          <svg className="w-4 h-4 stroke-emerald-400 fill-none stroke-2" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-white mb-1">
          {summary.totalCustomers.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500">Unique customer accounts</div>
      </div>

      {/* Requests */}
      <div className="bg-dark-card border border-dark-border hover:border-slate-700/80 rounded-xl p-5 relative overflow-hidden transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-cyan-500" />
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <span>API Requests</span>
          <svg className="w-4 h-4 stroke-cyan-400 fill-none stroke-2" viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-white mb-1">
          {summary.totalRequests.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500">Total logged calls</div>
      </div>

      {/* Tokens */}
      <div className="bg-dark-card border border-dark-border hover:border-slate-700/80 rounded-xl p-5 relative overflow-hidden transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-500" />
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <span>Total Tokens</span>
          <svg className="w-4 h-4 stroke-slate-400 fill-none stroke-2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-white mb-1">
          {summary.totalTokens.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500">Input + output volume</div>
      </div>

      {/* Top Spender */}
      <div className="bg-gradient-to-b from-rose-500/10 to-dark-card border border-dark-border hover:border-rose-500/40 rounded-xl p-5 relative overflow-hidden transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500" />
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-rose-300 mb-2">
          <span>Top Spender</span>
          <svg className="w-4 h-4 stroke-rose-400 fill-none stroke-2" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div className="text-lg font-bold font-mono tracking-tight text-white mb-1 truncate" title={summary.topCustomer ? summary.topCustomer.customerId : 'None'}>
          {summary.topCustomer ? summary.topCustomer.customerId : 'None'}
        </div>
        <div className="text-xs text-slate-400">
          {summary.topCustomer ? `$${summary.topCustomer.cost.toFixed(2)} total spend` : 'No data ingested'}
        </div>
      </div>
    </section>
  );
};
