import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { CustomerBreakdown } from '../types/index.js';
import { useTheme } from '../context/ThemeContext.js';
import { formatPercent, formatUsd } from '../money.js';
import { useCardSpotlight } from '../hooks/useUiEffects.js';

interface CostChartProps {
  customers: CustomerBreakdown[];
  highlightColor?: string;
}

interface TooltipPayloadItem {
  payload: CustomerBreakdown;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip-enter bg-white dark:bg-[#141518] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-lg text-xs space-y-1">
        <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-1">
          {data.customerId}
        </div>
        <div className="flex justify-between gap-4 font-mono">
          <span className="text-zinc-500">Spend:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            ${formatUsd(data.totalCost)} USD
          </span>
        </div>
        <div className="flex justify-between gap-4 font-mono">
          <span className="text-zinc-500">Share:</span>
          <span className="text-zinc-700 dark:text-zinc-300 tabular-nums">
            {formatPercent(data.percentOfTotal)} of bill
          </span>
        </div>
        <div className="flex justify-between gap-4 font-mono">
          <span className="text-zinc-500">Volume:</span>
          <span className="text-zinc-700 dark:text-zinc-300 tabular-nums">
            {data.totalTokens.toLocaleString()} tokens
          </span>
        </div>
        <div className="flex justify-between gap-4 font-mono text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5">
          <span>Avg / Req:</span>
          <span className="tabular-nums">${formatUsd(data.avgCostPerRequest, 5)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const CostChart: React.FC<CostChartProps> = ({ customers, highlightColor = '#f59e0b' }) => {
  const { theme } = useTheme();
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const { onMouseMove } = useCardSpotlight();

  if (!customers || customers.length === 0) {
    return null;
  }

  // Display top 8 customers for optimal scannability
  const chartData = customers.slice(0, 8).map(customer => ({
    ...customer,
    totalCost: Number(customer.totalCost)
  }));

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#71717a' : '#71717a';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
  const barNeutral = isDark ? '#3f3f46' : '#a1a1aa';
  return (
    <section
      onMouseMove={onMouseMove}
      className="dashboard-enter surface-card bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-5 mb-6"
      style={{ animationDelay: '130ms' }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Customer Cost Distribution
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Top accounts ranked by gross LLM expenditure • Highlighted bar indicates highest-spend account
          </p>
        </div>
        <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
          Showing top {chartData.length} of {customers.length} accounts
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 8, right: 30, left: 110, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="2 2" stroke={gridColor} horizontal={false} />
            <XAxis
              type="number"
              stroke={axisColor}
              tickFormatter={(val: number) => `$${val}`}
              tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: axisColor }}
              axisLine={{ stroke: gridColor }}
              tickLine={{ stroke: gridColor }}
            />
            <YAxis
              type="category"
              dataKey="customerId"
              stroke={axisColor}
              tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: axisColor }}
              width={105}
              axisLine={{ stroke: gridColor }}
              tickLine={{ stroke: gridColor }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#27272a' : '#f4f4f5', opacity: 0.45 }} />
            <Bar dataKey="totalCost" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive={false}>
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? highlightColor : barNeutral}
                  fillOpacity={activeBar === null || activeBar === index ? 1 : 0.35}
                  className="chart-bar-enter cursor-pointer transition-opacity"
                  style={{ animationDelay: `${index * 55}ms` }}
                  onMouseEnter={() => setActiveBar(index)}
                  onMouseLeave={() => setActiveBar(null)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
