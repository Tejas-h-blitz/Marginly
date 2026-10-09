import React, { useState } from 'react';
import { CustomerBreakdown } from '../types/index.js';

interface CustomerTableProps {
  customers: CustomerBreakdown[];
  loading?: boolean;
}

type SortField = 'totalCost' | 'totalRequests' | 'totalTokens' | 'customerId';
type SortDirection = 'asc' | 'desc';

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers, loading = false }) => {
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

  return (
    <section className="bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm transition-colors">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Account Expenditure Breakdown
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Unit economics sorted by spend volume • Click any column header to sort
          </p>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Pills */}
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs">
            <button
              onClick={() => setFilterTier('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterTier === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterTier('high')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterTier === 'high'
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Whales (≥10%)
            </button>
            <button
              onClick={() => setFilterTier('low')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterTier === 'low'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Low (&lt;5%)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <svg
              className="w-3.5 h-3.5 stroke-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 fill-none stroke-2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer ID..."
              className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container with Sticky Header */}
      <div className="w-full overflow-x-auto max-h-[520px]">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="sticky top-0 bg-zinc-50/95 dark:bg-[#15161a]/95 backdrop-blur-sm border-b border-zinc-200/90 dark:border-zinc-800/90 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none z-10">
              <th className="py-2.5 px-3.5 w-12 text-center font-mono">#</th>
              <th
                onClick={() => handleSort('customerId')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Customer ID</span>
                  {sortField === 'customerId' && (
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('totalRequests')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Requests</span>
                  {sortField === 'totalRequests' && (
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
              <th className="py-2.5 px-3.5 text-right">Input Tokens</th>
              <th className="py-2.5 px-3.5 text-right">Output Tokens</th>
              <th
                onClick={() => handleSort('totalTokens')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Tokens</span>
                  {sortField === 'totalTokens' && (
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
              <th className="py-2.5 px-3.5 w-36">Spend Share</th>
              <th className="py-2.5 px-3.5 text-right">Avg / Req</th>
              <th
                onClick={() => handleSort('totalCost')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Cost (USD)</span>
                  {sortField === 'totalCost' && (
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {loading ? (
              // Polished Loading Skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  <td className="py-3 px-3.5 text-center">
                    <div className="h-3 w-4 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="h-3.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="h-2 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="h-3.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                  {customers.length === 0 ? (
                    <div className="max-w-xs mx-auto py-2">
                      <div className="w-9 h-9 mx-auto mb-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      </div>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200 text-xs">No usage records ingested</p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                        Upload an OpenAI or Anthropic CSV export to calculate customer unit costs.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs">No customers matching &quot;{searchTerm}&quot; under this filter.</p>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((c, idx) => {
                const rank = idx + 1;
                const isWhale = c.percentOfTotal >= 20 || rank === 1;

                return (
                  <tr
                    key={c.customerId}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-2.5 px-3.5 text-center font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                      {rank}
                    </td>

                    {/* Customer ID + Copy Button */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                          {c.customerId}
                        </span>
                        <button
                          onClick={() => copyToClipboard(c.customerId)}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-0.5"
                          title="Copy Customer ID"
                        >
                          {copiedId === c.customerId ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">✓</span>
                          ) : (
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Requests */}
                    <td className="py-2.5 px-3.5 text-right text-zinc-600 dark:text-zinc-400 font-mono tabular-nums text-xs">
                      {c.totalRequests.toLocaleString()}
                    </td>

                    {/* Input Tokens */}
                    <td className="py-2.5 px-3.5 text-right text-zinc-500 dark:text-zinc-400 font-mono tabular-nums text-xs">
                      {c.totalInputTokens.toLocaleString()}
                    </td>

                    {/* Output Tokens */}
                    <td className="py-2.5 px-3.5 text-right text-zinc-500 dark:text-zinc-400 font-mono tabular-nums text-xs">
                      {c.totalOutputTokens.toLocaleString()}
                    </td>

                    {/* Total Tokens */}
                    <td className="py-2.5 px-3.5 text-right text-zinc-800 dark:text-zinc-200 font-mono tabular-nums text-xs font-medium">
                      {c.totalTokens.toLocaleString()}
                    </td>

                    {/* Spend Share Inline Bar */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isWhale
                                ? 'bg-amber-500'
                                : 'bg-zinc-400 dark:bg-zinc-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(3, c.percentOfTotal))}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400 min-w-[34px] text-right">
                          {c.percentOfTotal}%
                        </span>
                      </div>
                    </td>

                    {/* Avg Cost / Req */}
                    <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-xs text-zinc-500 dark:text-zinc-400">
                      ${c.avgCostPerRequest.toFixed(4)}
                    </td>

                    {/* Total Cost */}
                    <td className={`py-2.5 px-3.5 text-right font-mono tabular-nums font-semibold text-xs ${
                      isWhale
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}>
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
