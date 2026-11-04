export interface RawUsageInput {
  customer_id?: string;
  customerId?: string;
  customer?: string;
  timestamp?: string;
  time?: string;
  date?: string;
  model_name?: string;
  modelName?: string;
  model?: string;
  input_tokens?: number | string;
  inputTokens?: number | string;
  output_tokens?: number | string;
  outputTokens?: number | string;
}

export interface CalculatedRecord {
  customerId: string;
  timestamp: Date | null;
  modelName: string;
  resolvedModel: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  unpriced: boolean;
}

export interface CustomerBreakdown {
  customerId: string;
  monthlyRevenueUsd: string | null;
  totalRequests: number;
  pricedRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: string;
  avgCostPerRequest: string;
  percentOfTotal: string;
  marginUsd: string | null;
  marginPercent: string | null;
  unprofitable: boolean;
}

export interface UsageSummary {
  month: string;
  availableMonths: string[];
  untimestampedRequests: number;
  totalCustomers: number;
  totalRequests: number;
  pricedRequests: number;
  avgCostPerRequest: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: string;
  totalRevenueUsd: string | null;
  totalMarginUsd: string | null;
  blendedMarginPercent: string | null;
  unprofitableCustomers: number;
  topCustomer: {
    customerId: string;
    cost: string;
  } | null;
  unpricedModels: Array<{
    modelName: string;
    requestCount: number;
  }>;
}

export interface PastePayload {
  content: string;
  format?: 'csv' | 'json';
}
