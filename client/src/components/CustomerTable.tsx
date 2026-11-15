import React, { useEffect, useRef, useState } from 'react';
import { CustomerBreakdown } from '../types/index.js';
import { compareMoney, formatFixedUsd, formatPercent } from '../money.js';

interface CustomerTableProps {
  customers: CustomerBreakdown[];
  month: string;
  onSaveRevenue: (customerId: string, value: string | null, month: string) => Promise<boolean>;
  onViewCustomer: (customerId: string) => void;
  onImport: () => void;
  onCopyError: (message: string) => void;
  loading?: boolean;
}

type SortField = 'totalCost' | 'totalRequests' | 'totalTokens' | 'customerId';
type SortDirection = 'asc' | 'desc';

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  month,
  onSaveRevenue,
  onViewCustomer,
  onImport,
  onCopyError,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalCost');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterTier, setFilterTier] = useState<'all' | 'high' | 'low'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline revenue editing state
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [draftRevenue, setDraftRevenue] = useState<string>('');
  const [savingCustomerId, setSavingCustomerId] = useState<string | null>(null);
  const [savedCustomerId, setSavedCustomerId] = useState<string | null>(null);
  const [errorCustomerId, setErrorCustomerId] = useState<string | null>(null);

  const showMonthlyMetrics = month !== 'all';
  const copiedTimeout = useRef<number | null>(null);
  const savedTimeout = useRef<number | null>(null);
  const scrollContainer = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (copiedTimeout.current !== null) window.clearTimeout(copiedTimeout.current);
    if (savedTimeout.current !== null) window.clearTimeout(savedTimeout.current);
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
      onCopyError('Could not copy customer ID to clipboard.');
    }
  };

  const downloadUsageTemplate = () => {
    const csvContent = 'customer_id,timestamp,model_name,input_tokens,output_tokens\ncustomer_001,2026-11-01T10:00:00Z,gpt-4o,1000,250\n';
    const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marginly-usage-template.csv';
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const startEditing = (customerId: string, currentValue: string | null) => {
    setEditingCustomerId(customerId);
    setDraftRevenue(currentValue ?? '');
    setErrorCustomerId(null);
  };

  const cancelEditing = () => {
    setEditingCustomerId(null);
    setDraftRevenue('');
    setErrorCustomerId(null);
  };

  const saveRevenue = async (customerId: string) => {
    setSavingCustomerId(customerId);
    setErrorCustomerId(null);
    const valueToSave = draftRevenue.trim() ? draftRevenue.trim() : null;
    const success = await onSaveRevenue(customerId, valueToSave, month);
    setSavingCustomerId(null);
    if (success) {
      setEditingCustomerId(null);
      setSavedCustomerId(customerId);
      if (savedTimeout.current !== null) window.clearTimeout(savedTimeout.current);
      savedTimeout.current = window.setTimeout(() => {
        setSavedCustomerId(null);
        savedTimeout.current = null;
      }, 2500);
    } else {
      setErrorCustomerId(customerId);
    }
  };

  const whalesCount = customers.filter(c => compareMoney(c.percentOfTotal, '10') >= 0).length;
  const lowCount = customers.filter(c => compareMoney(c.percentOfTotal, '5') < 0).length;

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
      className="dashboard-enter customer-table-card surface-card bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl overflow-hidden max-w-full"
      style={{ animationDelay: '195ms' }}
    >
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Account Expenditure Breakdown
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
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
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterTier('high')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterTier === 'high'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Whales (≥10%) ({whalesCount})
            </button>
            <button
              onClick={() => setFilterTier('low')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterTier === 'low'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Low (&lt;5%) ({lowCount})
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
              className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 rounded-lg pl-8 pr-7 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-colors"
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

      {/* Empty State with Download CSV Template */}
      {!loading && customers.length === 0 && (
        <div className="p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 mx-auto mb-3 flex items-center justify-center">
            <svg className="w-6 h-6 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No customer usage logs found
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
            Upload your OpenAI or Anthropic API usage logs to compare priced costs across customer accounts, spot whale concentration, and analyze monthly margins.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onImport}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-none dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            >
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Import usage logs
            </button>
            <button
              type="button"
              onClick={downloadUsageTemplate}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV template
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-4 sm:p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skel-row-${i}`} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-32 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="flex items-center gap-6">
                <div className="w-16 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-20 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-24 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Stacked Card View (< 768px): Customer ID & Cost ALWAYS visible */}
      {!loading && customers.length > 0 && (
        <div className="block md:hidden divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-600 dark:text-zinc-400">
              No accounts match &quot;{searchTerm}&quot;.
            </div>
          ) : (
            filtered.map((c, idx) => {
              const rank = idx + 1;
              const isWhale = compareMoney(c.percentOfTotal, '20') >= 0 || rank === 1;
              const initials = c.customerId.replace(/^(cust_|acct_|user_)/, '').slice(0, 2).toUpperCase();
              const isEditing = editingCustomerId === c.customerId;

              return (
                <div
                  key={`card-${c.customerId}`}
                  className={`p-4 space-y-3 transition-colors ${
                    c.unprofitable ? 'bg-rose-500/[0.03] dark:bg-rose-500/[0.04]' : ''
                  }`}
                >
                  {/* Top Header Row: Rank, Customer ID + Avatar & Total Cost (Always Visible) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-mono text-xs font-bold shrink-0 ${
                        rank === 1
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}>
                        #{rank}
                      </span>
                      <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-center font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                        {initials}
                      </div>
                      <span className="font-mono font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {c.customerId}
                      </span>
                      <button
                        type="button"
                        aria-label={`Copy ${c.customerId}`}
                        onClick={() => copyToClipboard(c.customerId)}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded"
                      >
                        {copiedId === c.customerId ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                        ) : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewCustomer(c.customerId)}
                        className="shrink-0 rounded px-1.5 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Details
                      </button>
                    </div>

                    {/* Total Cost: Fixed 4 decimals */}
                    <div className="text-right shrink-0">
                      <div className="font-mono tabular-nums font-bold text-xs text-zinc-950 dark:text-zinc-50">
                        ${formatFixedUsd(c.totalCost, 4)}
                      </div>
                      <div className="font-mono tabular-nums text-xs text-zinc-600 dark:text-zinc-400">
                        {formatPercent(c.percentOfTotal, 1)} spend
                      </div>
                    </div>
                  </div>

                  {/* Spend Share Bar */}
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isWhale ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, Number(c.percentOfTotal)))}%` }}
                    />
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800/60 font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                    <div>
                      <span className="block text-zinc-500 font-sans">Requests</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">{c.totalRequests.toLocaleString('en-US')}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-500 font-sans">Total Tokens</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">{c.totalTokens.toLocaleString('en-US')}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-500 font-sans">Avg/Req</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">${formatFixedUsd(c.avgCostPerRequest, 4)}</span>
                    </div>
                  </div>

                  {/* Monthly Metrics (Revenue with inline pencil edit + Margin) */}
                  {showMonthlyMetrics && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-zinc-500 block text-xs">Revenue · {month}</span>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="font-mono text-zinc-500">$</span>
                            <input
                              autoFocus
                              type="text"
                              inputMode="decimal"
                              value={draftRevenue}
                              onChange={e => setDraftRevenue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveRevenue(c.customerId);
                                if (e.key === 'Escape') cancelEditing();
                              }}
                              className="w-20 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-900 dark:text-zinc-100"
                            />
                            <button
                              type="button"
                              onClick={() => saveRevenue(c.customerId)}
                              disabled={savingCustomerId === c.customerId}
                              className="px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium"
                            >
                              {savingCustomerId === c.customerId ? '...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="px-1.5 py-0.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                              {c.monthlyRevenueUsd !== null ? `$${formatFixedUsd(c.monthlyRevenueUsd, 2)}` : '—'}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditing(c.customerId, c.monthlyRevenueUsd)}
                              title={`Edit revenue for ${month}`}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            {savedCustomerId === c.customerId && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">Saved ✓</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-zinc-500 block text-xs">Margin</span>
                        <div className={`font-mono font-semibold tabular-nums text-xs ${
                          c.unprofitable ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'
                        }`}>
                          {c.marginUsd === null ? '—' : `$${formatFixedUsd(c.marginUsd, 2)}`}
                        </div>
                        {c.marginPercent !== null && (
                          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                            {formatPercent(c.marginPercent, 1)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Desktop Full Table View (>= 768px): Sticky Header, Fixed 4 Decimals Right-Aligned */}
      {!loading && customers.length > 0 && (
        <div
          ref={scrollContainer}
          className="hidden md:block table-scroll w-full max-w-full overflow-x-auto max-h-[560px]"
        >
          <table className="w-full min-w-[1080px] border-collapse text-left text-xs">
            <thead>
              <tr className="sticky top-0 bg-zinc-50/95 dark:bg-[#15161a]/95 backdrop-blur-sm border-b border-zinc-200/90 dark:border-zinc-800/90 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400 select-none z-10">
                <th className="py-2.5 px-3.5 w-12 text-center font-mono">#</th>
                <th aria-sort={sortField === 'customerId' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="py-2.5 px-3.5">
                  <button type="button" onClick={() => handleSort('customerId')} className="flex items-center gap-1 text-left hover:text-zinc-900 dark:hover:text-zinc-100">
                    <span>Customer ID</span>
                    {sortField === 'customerId' && <span className={`sort-indicator font-mono text-zinc-900 dark:text-zinc-100 ${sortDirection === 'asc' ? 'is-ascending' : ''}`}>▼</span>}
                  </button>
                </th>
                <th aria-sort={sortField === 'totalRequests' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="py-2.5 px-3.5 text-right font-mono">
                  <button type="button" onClick={() => handleSort('totalRequests')} className="ml-auto flex items-center justify-end gap-1 hover:text-zinc-900 dark:hover:text-zinc-100">
                    <span>Requests</span>
                    {sortField === 'totalRequests' && <span className={`sort-indicator font-mono text-zinc-900 dark:text-zinc-100 ${sortDirection === 'asc' ? 'is-ascending' : ''}`}>▼</span>}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 text-right font-mono">Input Tokens</th>
                <th className="py-2.5 px-3.5 text-right font-mono">Output Tokens</th>
                <th aria-sort={sortField === 'totalTokens' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="py-2.5 px-3.5 text-right font-mono">
                  <button type="button" onClick={() => handleSort('totalTokens')} className="ml-auto flex items-center justify-end gap-1 hover:text-zinc-900 dark:hover:text-zinc-100">
                    <span>Total Tokens</span>
                    {sortField === 'totalTokens' && <span className={`sort-indicator font-mono text-zinc-900 dark:text-zinc-100 ${sortDirection === 'asc' ? 'is-ascending' : ''}`}>▼</span>}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 w-36">Spend Share</th>
                <th className="py-2.5 px-3.5 text-right font-mono">Avg / Req (USD)</th>
                {showMonthlyMetrics && (
                  <>
                    <th className="py-2.5 px-3.5">
                      <div className="flex flex-col">
                        <span>Revenue · {month}</span>
                        <span className="text-zinc-500 dark:text-zinc-400 font-sans text-xs normal-case font-normal">
                          Effective from this month
                        </span>
                      </div>
                    </th>
                    <th className="py-2.5 px-3.5 text-right font-mono">Margin</th>
                  </>
                )}
                <th aria-sort={sortField === 'totalCost' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'} className="py-2.5 px-3.5 text-right font-mono">
                  <button type="button" onClick={() => handleSort('totalCost')} className="ml-auto flex items-center justify-end gap-1 hover:text-zinc-900 dark:hover:text-zinc-100">
                    <span>Total Cost (USD)</span>
                    {sortField === 'totalCost' && <span className={`sort-indicator font-mono text-zinc-900 dark:text-zinc-100 ${sortDirection === 'asc' ? 'is-ascending' : ''}`}>▼</span>}
                  </button>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={showMonthlyMetrics ? 11 : 9} className="text-center py-12 text-zinc-600 dark:text-zinc-400 text-xs">
                    No customers matching &quot;{searchTerm}&quot; under this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => {
                  const rank = idx + 1;
                  const isWhale = compareMoney(c.percentOfTotal, '20') >= 0 || rank === 1;
                  const initials = c.customerId.replace(/^(cust_|acct_|user_)/, '').slice(0, 2).toUpperCase();
                  const isEditing = editingCustomerId === c.customerId;

                  return (
                    <tr
                      key={c.customerId}
                      className={`customer-row ${c.unprofitable ? 'is-unprofitable bg-rose-500/[0.03] dark:bg-rose-500/[0.04]' : ''} hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors`}
                    >
                      {/* Rank */}
                      <td className="py-2.5 px-3.5 text-center font-mono text-xs">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-mono text-xs ${
                          rank === 1
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-xs'
                            : rank <= 3
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}>
                          {rank}
                        </span>
                      </td>

                      {/* Customer ID + Avatar Badge + Copy Button */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-center font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0 select-none">
                            {initials}
                          </div>
                          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                            {c.customerId}
                          </span>
                          <button
                            type="button"
                            aria-label={copiedId === c.customerId ? 'Customer ID copied' : `Copy ${c.customerId}`}
                            onClick={() => copyToClipboard(c.customerId)}
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Copy Customer ID"
                          >
                            {copiedId === c.customerId ? (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                            ) : (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                              </svg>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewCustomer(c.customerId)}
                            title={`View details for ${c.customerId}`}
                            className="rounded px-1.5 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Details
                          </button>
                        </div>
                      </td>

                      {/* Requests */}
                      <td className="py-2.5 px-3.5 text-right text-zinc-700 dark:text-zinc-300 font-mono tabular-nums text-xs">
                        {c.totalRequests.toLocaleString('en-US')}
                      </td>

                      {/* Input Tokens */}
                      <td className="py-2.5 px-3.5 text-right text-zinc-600 dark:text-zinc-400 font-mono tabular-nums text-xs">
                        {c.totalInputTokens.toLocaleString('en-US')}
                      </td>

                      {/* Output Tokens */}
                      <td className="py-2.5 px-3.5 text-right text-zinc-600 dark:text-zinc-400 font-mono tabular-nums text-xs">
                        {c.totalOutputTokens.toLocaleString('en-US')}
                      </td>

                      {/* Total Tokens */}
                      <td className="py-2.5 px-3.5 text-right text-zinc-800 dark:text-zinc-200 font-mono tabular-nums text-xs font-medium">
                        {c.totalTokens.toLocaleString('en-US')}
                      </td>

                      {/* Spend Share Inline Bar */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden p-0.5 border border-zinc-200/50 dark:border-zinc-700/40">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isWhale
                                  ? 'bg-zinc-900 dark:bg-zinc-100'
                                  : 'bg-zinc-300 dark:bg-zinc-700'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(4, Number(c.percentOfTotal)))}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-400 min-w-[38px] text-right font-medium">
                            {formatPercent(c.percentOfTotal, 1)}
                          </span>
                        </div>
                      </td>

                      {/* Avg Cost / Req: Fixed 4 Decimals Right-Aligned */}
                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-xs text-zinc-700 dark:text-zinc-300">
                        ${formatFixedUsd(c.avgCostPerRequest, 4)}
                      </td>

                      {showMonthlyMetrics && (
                        <>
                          {/* Monthly Revenue: Text with small pencil icon, clicking turns into input with Save/Cancel */}
                          <td className="py-2 px-3.5">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 font-mono text-xs">$</span>
                                <input
                                  autoFocus
                                  aria-label={`Monthly revenue for ${c.customerId}`}
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  value={draftRevenue}
                                  onChange={e => setDraftRevenue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      saveRevenue(c.customerId);
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      cancelEditing();
                                    }
                                  }}
                                  className={`w-24 rounded-lg border ${
                                    errorCustomerId === c.customerId
                                      ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500'
                                      : 'border-zinc-300 dark:border-zinc-700 focus:border-zinc-500'
                                  } bg-white dark:bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-900 dark:text-zinc-100 outline-none shadow-xs`}
                                />
                                <button
                                  type="button"
                                  disabled={savingCustomerId === c.customerId}
                                  onClick={() => saveRevenue(c.customerId)}
                                  className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
                                >
                                  {savingCustomerId === c.customerId ? '...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  disabled={savingCustomerId === c.customerId}
                                  onClick={cancelEditing}
                                  className="px-2 py-1 rounded-md text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-mono tabular-nums text-xs text-zinc-900 dark:text-zinc-100 font-medium">
                                  {c.monthlyRevenueUsd !== null ? `$${formatFixedUsd(c.monthlyRevenueUsd, 2)}` : '—'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => startEditing(c.customerId, c.monthlyRevenueUsd)}
                                  title={`Edit revenue for ${month}`}
                                  aria-label={`Edit monthly revenue for ${c.customerId}`}
                                  className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                {savedCustomerId === c.customerId && (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono animate-fadeIn">
                                    Saved ✓
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Margin */}
                          <td className={`py-2.5 px-3.5 text-right font-mono tabular-nums text-xs font-semibold ${
                            c.unprofitable
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-zinc-800 dark:text-zinc-200'
                          }`}>
                            {c.marginUsd === null ? (
                              '—'
                            ) : (
                              <>
                                <span>${formatFixedUsd(c.marginUsd, 2)}</span>
                                <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                                  {formatPercent(c.marginPercent, 1)}
                                </span>
                              </>
                            )}
                          </td>
                        </>
                      )}

                      {/* Total Cost: Fixed 4 Decimals Right-Aligned */}
                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-semibold text-xs text-zinc-950 dark:text-zinc-50">
                        ${formatFixedUsd(c.totalCost, 4)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
