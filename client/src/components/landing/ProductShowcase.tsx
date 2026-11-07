import React from 'react';
import { CostChart } from '../CostChart.js';
import { KpiGrid } from '../KpiGrid.js';
import { UnpricedModelsWarning } from '../app/UnpricedModelsWarning.js';
import { CustomerBreakdown, UsageSummary } from '../../types/index.js';
import { useTheme } from '../../context/ThemeContext.js';

interface ProductShowcaseProps {
  onLaunchApp: () => void;
}

const SAMPLE_CUSTOMERS: CustomerBreakdown[] = [
  {
    customerId: 'acct_acme',
    monthlyRevenueUsd: '70.00',
    totalRequests: 12,
    pricedRequests: 11,
    totalInputTokens: 140000,
    totalOutputTokens: 80000,
    totalTokens: 220000,
    totalCost: '9.40',
    avgCostPerRequest: '0.85455',
    percentOfTotal: '58.02',
    marginUsd: '60.60',
    marginPercent: '86.57',
    unprofitable: false
  },
  {
    customerId: 'acct_north',
    monthlyRevenueUsd: '49.00',
    totalRequests: 10,
    pricedRequests: 9,
    totalInputTokens: 110000,
    totalOutputTokens: 65000,
    totalTokens: 175000,
    totalCost: '4.30',
    avgCostPerRequest: '0.47778',
    percentOfTotal: '26.54',
    marginUsd: '44.70',
    marginPercent: '91.22',
    unprofitable: false
  },
  {
    customerId: 'acct_studio',
    monthlyRevenueUsd: '48.00',
    totalRequests: 10,
    pricedRequests: 10,
    totalInputTokens: 120000,
    totalOutputTokens: 67000,
    totalTokens: 187000,
    totalCost: '2.50',
    avgCostPerRequest: '0.25000',
    percentOfTotal: '15.43',
    marginUsd: '45.50',
    marginPercent: '94.79',
    unprofitable: false
  }
];

const SAMPLE_SUMMARY: UsageSummary = {
  month: '2026-10',
  availableMonths: ['2026-10'],
  untimestampedRequests: 0,
  totalCustomers: SAMPLE_CUSTOMERS.length,
  totalRequests: 32,
  pricedRequests: 30,
  avgCostPerRequest: '0.54000',
  totalInputTokens: 370000,
  totalOutputTokens: 212000,
  totalTokens: 582000,
  totalCost: '16.20',
  totalRevenueUsd: '167.00',
  totalMarginUsd: '150.80',
  blendedMarginPercent: '90.30',
  unprofitableCustomers: 0,
  topCustomer: { customerId: 'acct_acme', cost: '9.40' },
  unpricedModels: [{ modelName: 'example-unlisted-model', requestCount: 2 }]
};

const CALLOUTS = [
  'Customer-level cost table',
  'Spend concentration',
  'Unpriced-model warning',
  'CSV export'
];

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({ onLaunchApp }) => {
  const { theme } = useTheme();
  const highlightColor = theme === 'dark' ? '#ffffff' : '#18181b';

  return (
    <section id="preview" className="landing-preview landing-section-enter scroll-mt-24 border-b border-zinc-200/80 py-16 dark:border-zinc-800/80 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">A look inside Marginly</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">Customer costs, in context</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              These example values are illustrative. The preview uses the same dashboard KPI and chart components as the app.
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-mono text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Sample data
          </span>
        </div>

        <div className="mt-7 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40 sm:p-5">
          <KpiGrid summary={SAMPLE_SUMMARY} />
          <UnpricedModelsWarning models={SAMPLE_SUMMARY.unpricedModels} month={SAMPLE_SUMMARY.month} />
          <CostChart customers={SAMPLE_CUSTOMERS} highlightColor={highlightColor} />

        <div className="surface-card overflow-hidden rounded-xl border border-zinc-200/90 bg-white dark:border-zinc-800/80 dark:bg-[#121316]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800/80">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Customer breakdown</h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Sample month: October 2026</p>
            </div>
            <span className="rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">CSV export available</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/70 dark:text-zinc-400">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Customer</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Requests</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Spend share</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Revenue</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Margin</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {SAMPLE_CUSTOMERS.map(customer => (
                  <tr key={customer.customerId} className="text-zinc-700 dark:text-zinc-300">
                    <th scope="row" className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-100">{customer.customerId}</th>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{customer.totalRequests}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{customer.percentOfTotal}%</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">${customer.monthlyRevenueUsd}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">${customer.marginUsd}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">${customer.totalCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Included dashboard features">
          {CALLOUTS.map(callout => (
            <li key={callout} className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              {callout}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onLaunchApp} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-300 dark:hover:bg-zinc-900">
          Upload your usage CSV <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </section>
  );
};
