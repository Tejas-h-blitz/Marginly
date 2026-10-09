import React from 'react';
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

interface CostChartProps {
  customers: CustomerBreakdown[];
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
      <div className="bg-white dark:bg-[#141518] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-lg text-xs space-y-1">
        <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-1">
          {data.customerId}
        </div>
        <div className="flex justify-between gap-4 font-mono">
          <span className="text-zinc-500">Spend:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            ${data.totalCost.toFixed(4)} USD
          </span>
        </div>
        <div className="flex justify-between gap-4 font-mono">
          <span className="text-zinc-500">Share:</span>
          <span className="text-zinc-700 dark:text-zinc-300 tabular-nums">
            {data.percentOfTotal}% of bill
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
          <span className="tabular-nums">${data.avgCostPerRequest.toFixed(5)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const CostChart: React.FC<CostChartProps> = ({ customers }) => {
  const { theme } = useTheme();

  if (!customers || customers.length === 0) {
    return null;
  }

  // Display top 8 customers for optimal scannability
  const chartData = customers.slice(0, 8);

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#71717a' : '#71717a';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
  const barNeutral = isDark ? '#3f3f46' : '#a1a1aa';
  const barWhale = '#f59e0b'; // Amber accent for top whale account

  return (
    <section className="bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-5 mb-6 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Customer Cost Distribution
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Top accounts ranked by gross LLM expenditure • Amber indicates the primary whale account
          </p>
        </div>
        <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
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
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalCost" radius={[0, 4, 4, 0]} barSize={16}>
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? barWhale : barNeutral}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
