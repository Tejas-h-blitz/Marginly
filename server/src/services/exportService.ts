import { CustomerBreakdown } from '../types/index.js';

export function generateCustomerBreakdownCsv(customers: CustomerBreakdown[]): string {
  const headers = [
    'customer_id',
    'total_requests',
    'priced_requests',
    'total_input_tokens',
    'total_output_tokens',
    'total_tokens',
    'total_cost_usd',
    'avg_cost_per_request_usd',
    'percent_of_total_cost'
  ];

  const rows = customers.map(c => [
    `"${c.customerId.replace(/"/g, '""')}"`,
    c.totalRequests,
    c.pricedRequests,
    c.totalInputTokens,
    c.totalOutputTokens,
    c.totalTokens,
    c.totalCost.toFixed(4),
    c.avgCostPerRequest.toFixed(5),
    `${Number(c.percentOfTotal.toFixed(2))}%`
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
