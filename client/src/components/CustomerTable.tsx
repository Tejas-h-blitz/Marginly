import React, { useState } from 'react';
import { CustomerBreakdown } from '../types/index.js';

interface CustomerTableProps {
  customers: CustomerBreakdown[];
}

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = customers.filter(c =>
    c.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 stroke-emerald-400 fill-none stroke-2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            Customer Breakdown
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sorted by total cost descending (highest spenders first)
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <svg className="w-4 h-4 stroke-slate-400 fill-none stroke-2 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer ID..."
            className="w-full bg-dark-secondary border border-dark-border focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-dark-border bg-dark-secondary/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Customer ID</th>
              <th className="py-3 px-4">Requests</th>
              <th className="py-3 px-4">Input Tokens</th>
              <th className="py-3 px-4">Output Tokens</th>
              <th className="py-3 px-4">Total Tokens</th>
              <th className="py-3 px-4">Spend Share</th>
              <th className="py-3 px-4">Avg Cost / Req</th>
              <th className="py-3 px-4">Total Cost (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  {customers.length === 0 ? (
                    <div>
                      <svg className="w-10 h-10 mx-auto mb-3 stroke-slate-500 fill-none stroke-2" viewBox="0 0 24 24">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      <p className="font-semibold text-slate-300">No usage data loaded yet.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click <strong>Load Sample Data</strong> above or upload a CSV to calculate costs.
                      </p>
                    </div>
                  ) : (
                    <p>No customers matching &quot;{searchTerm}&quot;</p>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((c, idx) => {
                const rank = idx + 1;
                let badgeStyle = 'bg-white/5 text-slate-400';
                if (rank === 1) badgeStyle = 'bg-rose-500/20 text-rose-400 border border-rose-500/40';
                else if (rank === 2) badgeStyle = 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
                else if (rank === 3) badgeStyle = 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40';

                const isHighCost = c.percentOfTotal >= 25 || rank === 1;

                return (
                  <tr key={c.customerId} className="hover:bg-dark-cardHover transition-colors">
                    <td className="py-3.5 px-4">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${badgeStyle}`}>
                        #{rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-100">
                      {c.customerId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {c.totalRequests.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {c.totalInputTokens.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {c.totalOutputTokens.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {c.totalTokens.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHighCost
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(3, c.percentOfTotal))}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 min-w-[34px]">
                          {c.percentOfTotal}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      ${c.avgCostPerRequest.toFixed(4)}
                    </td>
                    <td className={`py-3.5 px-4 font-mono font-bold text-sm ${isHighCost ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ${c.totalCost.toFixed(4)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
