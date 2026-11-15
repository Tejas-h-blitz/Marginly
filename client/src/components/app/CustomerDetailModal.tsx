import React, { useEffect, useState } from 'react';
import { CustomerBreakdown, CustomerDetail } from '../../types/index.js';
import { formatFixedUsd } from '../../money.js';

interface CustomerDetailModalProps {
  customerId: string | null;
  detail: CustomerDetail | null;
  customers: CustomerBreakdown[];
  loading: boolean;
  error: string | null;
  merging: boolean;
  onClose: () => void;
  onMerge: (sourceCustomerId: string, targetCustomerId: string) => Promise<boolean>;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customerId,
  detail,
  customers,
  loading,
  error,
  merging,
  onClose,
  onMerge
}) => {
  const [mergeTarget, setMergeTarget] = useState('');
  const [showMerge, setShowMerge] = useState(false);

  useEffect(() => {
    setMergeTarget('');
    setShowMerge(false);
  }, [customerId]);

  if (!customerId) return null;

  const submitMerge = async () => {
    if (!mergeTarget) return;
    const confirmed = window.confirm(
      `Merge ${customerId} into ${mergeTarget}? Usage will be combined. If both have revenue for the same month, ${mergeTarget}'s value will be kept.`
    );
    if (confirmed) await onMerge(customerId, mergeTarget);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-detail-title"
        onClick={event => event.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-[#121316]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <h2 id="customer-detail-title" className="truncate font-mono text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              {customerId}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {detail?.month === 'all' ? 'All-time account activity' : `Activity for ${detail?.month ?? 'selected period'}`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close customer details" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {loading && <p className="text-sm text-zinc-500">Loading customer details…</p>}
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
          {detail && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Requests', detail.totalRequests.toLocaleString('en-US')],
                  ['Priced', detail.pricedRequests.toLocaleString('en-US')],
                  ['Unpriced', detail.unpricedRequests.toLocaleString('en-US')],
                  ['Cost', `$${formatFixedUsd(detail.totalCost, 4)}`]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <span className="block text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
                    <span className="mt-1 block font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</span>
                  </div>
                ))}
              </div>

              <section>
                <h3 className="mb-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">Model usage</h3>
                {detail.models.length === 0 ? (
                  <p className="text-xs text-zinc-500">No usage in this period.</p>
                ) : (
                  <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                    {detail.models.map(model => (
                      <li key={model.modelName} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
                        <div className="min-w-0">
                          <code className="block truncate font-medium text-zinc-900 dark:text-zinc-100">{model.modelName}</code>
                          <span className="text-[10px] text-zinc-500">{model.requests} requests · {(model.totalInputTokens + model.totalOutputTokens).toLocaleString('en-US')} tokens</span>
                        </div>
                        <span className="shrink-0 font-mono text-zinc-700 dark:text-zinc-300">${formatFixedUsd(model.totalCost, 4)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">Revenue history</h3>
                {detail.revenueHistory.length === 0 ? (
                  <p className="text-xs text-zinc-500">No revenue history recorded.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {detail.revenueHistory.map(version => (
                      <li key={version.effectiveMonth} className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-800">
                        <span className="text-zinc-500">{version.effectiveMonth} · </span>
                        <span className="font-mono text-zinc-800 dark:text-zinc-200">
                          {version.monthlyRevenueUsd === null ? 'Cleared' : `$${formatFixedUsd(version.monthlyRevenueUsd, 2)}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">Recent usage</h3>
                {detail.recentUsage.length === 0 ? (
                  <p className="text-xs text-zinc-500">No usage in this period.</p>
                ) : (
                  <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                    {detail.recentUsage.map((usage, index) => (
                      <li key={`${usage.timestamp ?? 'untimestamped'}-${usage.modelName}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 text-[10px]">
                        <div className="min-w-0">
                          <span className="block truncate font-mono text-zinc-800 dark:text-zinc-200">{usage.modelName}</span>
                          <span className="text-zinc-500">{usage.timestamp ? new Date(usage.timestamp).toLocaleString() : 'No timestamp'}</span>
                        </div>
                        <span className="shrink-0 text-right text-zinc-600 dark:text-zinc-400">
                          {(usage.inputTokens + usage.outputTokens).toLocaleString('en-US')} tokens
                          <span className="block font-mono">{usage.cost === null ? 'Unpriced' : `$${formatFixedUsd(usage.cost, 4)}`}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                {!showMerge ? (
                  <button type="button" onClick={() => setShowMerge(true)} className="text-xs font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
                    Merge into another customer…
                  </button>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300" htmlFor="merge-customer-target">Merge this customer into</label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select id="merge-customer-target" value={mergeTarget} onChange={event => setMergeTarget(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900">
                        <option value="">Select a target customer</option>
                        {customers.filter(customer => customer.customerId !== customerId).map(customer => (
                          <option key={customer.customerId} value={customer.customerId}>{customer.customerId}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => void submitMerge()} disabled={!mergeTarget || merging} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950">
                        {merging ? 'Merging…' : 'Merge customers'}
                      </button>
                      <button type="button" onClick={() => setShowMerge(false)} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs dark:border-zinc-700">Cancel</button>
                    </div>
                    <p className="text-[10px] text-zinc-500">The target’s revenue value wins for months with conflicts. Duplicate usage rows are collapsed.</p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
