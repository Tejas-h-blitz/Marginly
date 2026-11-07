import React, { useEffect, useRef, useState } from 'react';
import { CustomerBreakdown } from '../types/index.js';
import { compareMoney, formatPercent, formatUsd } from '../money.js';

interface CustomerTableProps {
  customers: CustomerBreakdown[];
  month: string;
  onSaveRevenue: (customerId: string, value: string | null) => Promise<boolean>;
  onImport: () => void;
  onCopyError: (message: string) => void;
  loading?: boolean;
}

type SortField = 'totalCost' | 'totalRequests' | 'totalTokens' | 'customerId';
type SortDirection = 'asc' | 'desc';

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers, month, onSaveRevenue, onImport, onCopyError, loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalCost');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterTier, setFilterTier] = useState<'all' | 'high' | 'low'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revenueDrafts, setRevenueDrafts] = useState<Record<string, string>>({});
  const [savingRevenueId, setSavingRevenueId] = useState<string | null>(null);
  const showMonthlyMetrics = month !== 'all';
  const copiedTimeout = useRef<number | null>(null);
  const skeletonWidths = showMonthlyMetrics
    ? ['w-4', 'w-32', 'w-12', 'w-16', 'w-16', 'w-20', 'w-24', 'w-14', 'w-20', 'w-16', 'w-16']
    : ['w-4', 'w-32', 'w-12', 'w-16', 'w-16', 'w-20', 'w-24', 'w-14', 'w-16'];
  const scrollContainer = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (copiedTimeout.current !== null) window.clearTimeout(copiedTimeout.current);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);
      if (copiedTimeout.current !== null) window.clearTimeout(copiedTimeout.current);
      copiedTimeout.current = window.setTimeout(() => {
        setCopiedId(null);
        copiedTimeout.current = null;
      }, 1500);
    } catch (error) {
      console.error('Failed to copy customer ID:', error);
      onCopyError('Could not copy customer ID to the clipboard.');
    }
  };

  // 1. Filter
  let filtered = customers.filter(c =>
    c.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterTier === 'high') {
    filtered = filtered.filter(c => compareMoney(c.percentOfTotal, '10') >= 0);
  } else if (filterTier === 'low') {
    filtered = filtered.filter(c => compareMoney(c.percentOfTotal, '5') < 0);
  }

  // 2. Sort
  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortField === 'totalCost') {
      comparison = compareMoney(a.totalCost, b.totalCost);
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
    <section
      className="dashboard-enter customer-table-card surface-card bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl overflow-hidden"
      style={{ animationDelay: '195ms' }}
    >
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
      <div
        ref={scrollContainer}
        onScroll={event => event.currentTarget.classList.toggle('has-scrolled', event.currentTarget.scrollTop > 0)}
        className="table-scroll w-full overflow-x-auto max-h-[520px]"
      >
        <table className="w-full min-w-[1180px] border-collapse text-left text-xs">
          <thead>
            <tr className="sticky top-0 bg-zinc-50/95 dark:bg-[#15161a]/95 backdrop-blur-sm border-b border-zinc-200/90 dark:border-zinc-800/90 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none z-10">
              <th className="py-2.5 px-3.5 w-12 text-center font-mono">#</th>
              <th aria-sort={sortField === 'customerId' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="py-2.5 px-3.5">
                <button type="button" onClick={() => handleSort('customerId')} className="flex items-center gap-1 text-left hover:text-zinc-900 dark:hover:text-zinc-100">
                  <span>Customer ID</span>
                  {sortField === 'customerId' && <span className={`sort-indicator font-mono text-zinc-900 dark:text-zinc-100 ${sortDirection === 'asc' ? 'is-ascending' : ''}`}>▼</span>}
                </button>
              </th>
              <th aria-sort={sortField === 'totalRequests' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="py-2.5 px-3.5 text-right">
                <button type="button" onClick={() => handleSort('totalRequests')} className="ml-auto flex items-center justify-end gap-1 hover:text-zinc-900 dark:hover:text-zinc-100">
                  <span>Requests</span>
                  {sortField === 'totalRequests' && <span className={`sort-indicator font-mono text-zinc-900 dark:text-zinc-100 ${sortDirection === 'asc' ? 'is-ascending' : ''}`}>▼</span>}
                </button>
              </th>
              <th className="py-2.5 px-3.5 text-right">Input Tokens</th>
              <th className="py-2.5 px-3.5 text-right">Output Tokens</th>
              <th aria-sort={sortField === 'totalTokens' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="py-2.5 px-3.5 text-right">
                <button type="button" onClick={() => handleSort('totalTokens')} className="ml-auto flex items-center justify-end gap-1 hover:text-zinc-900 dark:hover:text-zinc-100">
                  <span>Total Tokens</span>
                  {sortField === 'totalTokens' && <span className={`sort-indicator font-mono text-zinc-900 dark:text-zinc-100 ${sortDirection === 'asc' ? 'is-ascending' : ''}`}>▼</span>}
                </button>
              </th>
              <th className="py-2.5 px-3.5 w-36">Spend Share</th>
              <th className="py-2.5 px-3.5 text-right">Avg / Priced Req</th>
              {showMonthlyMetrics && (
                <>
                  <th className="py-2.5 px-3.5">Monthly Revenue</th>
                  <th className="py-2.5 px-3.5 text-right">Margin</th>
                </>
              )}
              <th aria-sort={sortField === 'totalCost' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="py-2.5 px-3.5 text-right">
                <button type="button" onClick={() => handleSort('totalCost')} className="ml-auto flex items-center justify-end gap-1 hover:text-zinc-900 dark:hover:text-zinc-100">
                  <span>Total Cost (USD)</span>
                  {sortField === 'totalCost' && <span className={`sort-indicator font-mono text-zinc-900 dark:text-zinc-100 ${sortDirection === 'asc' ? 'is-ascending' : ''}`}>▼</span>}
                </button>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {skeletonWidths.map((width, columnIndex) => (
                    <td key={columnIndex} className={`py-2.5 px-3.5 ${columnIndex > 1 ? 'text-right' : ''}`}>
                      <div className={`shimmer h-3.5 ${width} rounded ${columnIndex > 1 ? 'ml-auto' : ''}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={showMonthlyMetrics ? 11 : 9} className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                  {customers.length === 0 ? (
                    <div className="max-w-sm mx-auto py-2">
                      <div className="w-10 h-10 mx-auto mb-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L7 9m5-5 5 5M5 14v5a1 1 0 001 1h12a1 1 0 001-1v-5" />
                        </svg>
                      </div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Start with your usage data</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                        Import a usage CSV or JSON file to see customer-level cost and margin.
                      </p>
                      <button
                        type="button"
                        onClick={onImport}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                      >
                        Import usage data
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs">No customers matching &quot;{searchTerm}&quot; under this filter.</p>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((c, idx) => {
                const rank = idx + 1;
                const isWhale = compareMoney(c.percentOfTotal, '20') >= 0 || rank === 1;
                const initials = c.customerId.replace(/^(cust_|acct_|user_)/, '').slice(0, 2).toUpperCase();

                return (
                  <tr
                    key={c.customerId}
                    className={`customer-row ${c.unprofitable ? 'is-unprofitable bg-rose-500/[0.03] dark:bg-rose-500/[0.04]' : ''} hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors`}
                  >
                    {/* Rank */}
                    <td className="py-2.5 px-3.5 text-center font-mono text-[11px]">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-mono text-[10px] ${
                        rank === 1
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300/60 dark:border-amber-700/50'
                          : rank <= 3
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }`}>
                        {rank}
                      </span>
                    </td>

                    {/* Customer ID + Avatar Badge + Copy Button */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-center font-mono text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 shrink-0 select-none">
                          {initials}
                        </div>
                        <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                          {c.customerId}
                        </span>
                        <button
                          type="button"
                          aria-label={copiedId === c.customerId ? 'Customer ID copied' : `Copy ${c.customerId}`}
                          onClick={() => copyToClipboard(c.customerId)}
                          className={`copy-button relative inline-flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${copiedId === c.customerId ? 'is-copied' : ''}`}
                          title="Copy Customer ID"
                        >
                          <svg className="copy-icon absolute h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
                          </svg>
                          <svg className="copy-check absolute h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                          </svg>
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
                        <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden p-0.5 border border-zinc-200/50 dark:border-zinc-700/40">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isWhale
                                ? 'bg-amber-500 dark:bg-amber-400'
                                : 'bg-zinc-400 dark:bg-zinc-500'
                            } spend-share-fill`}
                            style={{ width: `${Math.min(100, Math.max(4, Number(c.percentOfTotal)))}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400 min-w-[34px] text-right font-medium">
                          {formatPercent(c.percentOfTotal)}
                        </span>
                      </div>
                    </td>

                    {/* Avg Cost / Req */}
                    <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-xs text-zinc-500 dark:text-zinc-400">
                      ${formatUsd(c.avgCostPerRequest, 5)}
                    </td>

                    {showMonthlyMetrics && (
                      <>
                        <td className="py-2 px-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs">$</span>
                            <input
                              aria-label={`Monthly revenue for ${c.customerId}`}
                              type="text"
                              inputMode="decimal"
                              placeholder="—"
                              value={revenueDrafts[c.customerId] ?? c.monthlyRevenueUsd ?? ''}
                              onChange={event => setRevenueDrafts(current => ({
                                ...current,
                                [c.customerId]: event.target.value
                              }))}
                              onKeyDown={event => {
                                if (event.key === 'Enter') event.currentTarget.blur();
                              }}
                              className="w-24 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/80 px-2 py-1 font-mono text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 shadow-xs"
                            />
                            <button
                              type="button"
                              disabled={savingRevenueId === c.customerId}
                              onClick={async () => {
                                setSavingRevenueId(c.customerId);
                                const draft = revenueDrafts[c.customerId] ?? c.monthlyRevenueUsd ?? '';
                                const success = await onSaveRevenue(c.customerId, draft.trim() ? draft.trim() : null);
                                if (success) {
                                  setRevenueDrafts(current => {
                                    const next = { ...current };
                                    delete next[c.customerId];
                                    return next;
                                  });
                                }
                                setSavingRevenueId(null);
                              }}
                              className="px-2 py-1 rounded-md border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800 text-[10px] font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition-colors disabled:opacity-50 shadow-xs"
                            >
                              {savingRevenueId === c.customerId ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </td>
                        <td className={`py-2.5 px-3.5 text-right font-mono tabular-nums text-xs font-semibold ${
                          c.unprofitable
                            ? 'text-amber-800 dark:text-amber-300'
                            : 'text-zinc-800 dark:text-zinc-200'
                        }`}>
                          {c.marginUsd === null
                            ? '-'
                            : <><span>${formatUsd(c.marginUsd)}</span><span className="block text-[10px] font-normal opacity-70">{formatPercent(c.marginPercent)}</span></>}
                        </td>
                      </>
                    )}

                    {/* Total Cost */}
                    <td className={`py-2.5 px-3.5 text-right font-mono tabular-nums font-semibold text-xs ${
                      isWhale
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}>
                      ${formatUsd(c.totalCost)}
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
