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
  resolvedModel: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface CustomerBreakdown {
  customerId: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerRequest: number;
  percentOfTotal: number;
}

export interface UsageSummary {
  totalCustomers: number;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  topCustomer: {
    customerId: string;
    cost: number;
  } | null;
}

export interface PastePayload {
  content: string;
  format?: 'csv' | 'json';
}
