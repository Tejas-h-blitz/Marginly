import React, { useState } from 'react';
import { CustomerBreakdown } from '../types/index.js';

interface CustomerTableProps {
  customers: CustomerBreakdown[];
}

type SortField = 'totalCost' | 'totalRequests' | 'totalTokens' | 'customerId';
type SortDirection = 'asc' | 'desc';

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalCost');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterTier, setFilterTier] = useState<'all' | 'high' | 'low'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // 1. Filter
  let filtered = customers.filter(c =>
    c.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterTier === 'high') {
    filtered = filtered.filter(c => c.percentOfTotal >= 10);
  } else if (filterTier === 'low') {
    filtered = filtered.filter(c => c.percentOfTotal < 5);
  }

  // 2. Sort
  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortField === 'totalCost') {
      comparison = a.totalCost - b.totalCost;
    } else if (sortField === 'totalRequests') {
      comparison = a.totalRequests - b.totalRequests;
    } else if (sortField === 'totalTokens') {
      comparison = a.totalTokens - b.totalTokens;
    } else if (sortField === 'customerId') {
      comparison = a.customerId.localeCompare(b.customerId);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const getInitials = (id: string) => {
    const clean = id.replace(/^(cust_|user_|client_)/, '');
    const parts = clean.split('_');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <section className="bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-7 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 stroke-emerald-400 fill-none stroke-2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span>Customer Cost Breakdown</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unit economics sorted by spend volume • Click headers to change order
          </p>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-dark-secondary border border-dark-border text-xs">
            <button
              onClick={() => setFilterTier('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterTier === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterTier('high')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterTier === 'high'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Whales (&ge;10%)
            </button>
            <button
              onClick={() => setFilterTier('low')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterTier === 'low'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Low Spenders (&lt;5%)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <svg className="w-4 h-4 stroke-slate-400 fill-none stroke-2 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer ID..."
              className="w-full bg-dark-secondary border border-dark-border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-2xl border border-dark-border">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-dark-border bg-dark-secondary/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400 select-none">
              <th className="py-3 px-4">Rank</th>
              <th
                onClick={() => handleSort('customerId')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Customer ID</span>
                  {sortField === 'customerId' && (
                    <span className="text-emerald-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('totalRequests')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Requests</span>
                  {sortField === 'totalRequests' && (
                    <span className="text-emerald-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
              <th className="py-3 px-4 text-right">Input Tokens</th>
              <th className="py-3 px-4 text-right">Output Tokens</th>
              <th
                onClick={() => handleSort('totalTokens')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Tokens</span>
                  {sortField === 'totalTokens' && (
                    <span className="text-emerald-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
              <th className="py-3 px-4">Spend Share</th>
              <th className="py-3 px-4 text-right">Avg / Req</th>
              <th
                onClick={() => handleSort('totalCost')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Cost (USD)</span>
                  {sortField === 'totalCost' && (
                    <span className="text-emerald-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
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
                      <p className="font-semibold text-slate-300">No usage logs loaded yet.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click <strong>Import Logs</strong> in the top navigation bar to analyze your customer spend.
                      </p>
                    </div>
                  ) : (
                    <p>No customers matching &quot;{searchTerm}&quot; under this filter.</p>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((c, idx) => {
                const rank = idx + 1;
                let badgeStyle = 'bg-white/5 text-slate-400 border border-white/5';
                if (rank === 1) badgeStyle = 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
                else if (rank === 2) badgeStyle = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
                else if (rank === 3) badgeStyle = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40';

                const isHighCost = c.percentOfTotal >= 20 || rank === 1;
                const initials = getInitials(c.customerId);

                return (
                  <tr key={c.customerId} className="hover:bg-slate-900/60 transition-colors">
                    {/* Rank */}
                    <td className="py-3 px-4">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${badgeStyle}`}>
                        #{rank}
                      </span>
                    </td>

                    {/* Customer ID + Avatar Monogram + Copy */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center font-mono shrink-0">
                          {initials}
                        </div>
                        <span className="font-mono font-semibold text-slate-100 text-xs">
                          {c.customerId}
                        </span>
                        <button
                          onClick={() => copyToClipboard(c.customerId)}
                          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                          title="Copy Customer ID"
                        >
                          {copiedId === c.customerId ? (
                            <span className="text-[10px] text-emerald-400 font-sans font-bold">✓</span>
                          ) : (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Requests */}
                    <td className="py-3 px-4 text-right text-slate-300 font-mono text-xs">
                      {c.totalRequests.toLocaleString()}
                    </td>

                    {/* Input Tokens */}
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-xs">
                      {c.totalInputTokens.toLocaleString()}
                    </td>

                    {/* Output Tokens */}
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-xs">
                      {c.totalOutputTokens.toLocaleString()}
                    </td>

                    {/* Total Tokens */}
                    <td className="py-3 px-4 text-right text-slate-200 font-mono text-xs font-medium">
                      {c.totalTokens.toLocaleString()}
                    </td>

                    {/* Spend Share */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHighCost
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : 'bg-gradient-to-r from-indigo-500 to-cyan-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(3, c.percentOfTotal))}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 min-w-[34px]">
                          {c.percentOfTotal}%
                        </span>
                      </div>
                    </td>

                    {/* Avg Cost / Req */}
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                      ${c.avgCostPerRequest.toFixed(4)}
                    </td>

                    {/* Total Cost */}
                    <td className={`py-3 px-4 text-right font-mono font-bold text-sm ${isHighCost ? 'text-rose-400' : 'text-emerald-400'}`}>
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
