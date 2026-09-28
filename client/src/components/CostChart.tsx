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
      <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 shadow-xl text-xs space-y-1">
        <div className="font-mono font-bold text-white border-b border-slate-800 pb-1 mb-1">
          {data.customerId}
        </div>
        <div className="text-emerald-400 font-semibold">
          Total Cost: ${data.totalCost.toFixed(4)} USD
        </div>
        <div className="text-slate-300">
          Requests: {data.totalRequests.toLocaleString()}
        </div>
        <div className="text-slate-300">
          Tokens: {data.totalTokens.toLocaleString()} ({data.percentOfTotal}% of total spend)
        </div>
        <div className="text-slate-400 text-[11px]">
          Avg: ${data.avgCostPerRequest.toFixed(5)} / req
        </div>
      </div>
    );
  }
  return null;
};

export const CostChart: React.FC<CostChartProps> = ({ customers }) => {
  if (!customers || customers.length === 0) {
    return null;
  }

  // Display top 10 customers
  const chartData = customers.slice(0, 10);

  return (
    <section className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-7 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 stroke-cyan-400 fill-none stroke-2" viewBox="0 0 24 24">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Customer Cost Distribution
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Identifies high-expenditure customers eating into gross margins (Built with Recharts)
          </p>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 10, right: 30, left: 110, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
            <XAxis
              type="number"
              stroke="#94a3b8"
              tickFormatter={(val: number) => `$${val}`}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="customerId"
              stroke="#cbd5e1"
              tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#cbd5e1' }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalCost" radius={[0, 6, 6, 0]} barSize={20}>
              {chartData.map((_, index) => {
                let fill = '#6366f1'; // Indigo default
                if (index === 0) fill = '#f43f5e'; // Rose for #1
                else if (index === 1) fill = '#f59e0b'; // Amber for #2
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
