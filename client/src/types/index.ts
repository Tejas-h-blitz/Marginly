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

export interface ModelPricingItem {
  modelName: string;
  displayName: string;
  provider: string;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export interface PricingResponse {
  description: string;
  models: Record<string, ModelPricingItem>;
}

export interface AlertNotification {
  message: string;
  type: 'success' | 'error' | 'info';
}
