export interface CustomerBreakdown {
  customerId: string;
  monthlyRevenueUsd: string | null;
  totalRequests: number;
  pricedRequests: number;
  unpricedRequests: number;
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

export interface CustomerDetail {
  customerId: string;
  month: string;
  totalRequests: number;
  pricedRequests: number;
  unpricedRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: string;
  models: Array<{
    modelName: string;
    requests: number;
    pricedRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: string;
  }>;
  recentUsage: Array<{
    timestamp: string | null;
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cost: string | null;
  }>;
  revenueHistory: Array<{
    effectiveMonth: string;
    monthlyRevenueUsd: string | null;
  }>;
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
  upcoming: PriceVersionItem[];
  custom: PriceVersionItem[];
}

export interface PriceVersionItem {
  id: string;
  modelName: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  effectiveFrom: string;
}

export interface ImportHistoryItem {
  id: string;
  sourceName: string;
  sourceType: 'upload' | 'paste' | 'sample';
  totalRecords: number;
  insertedRecords: number;
  duplicateRecords: number;
  withinFileDuplicates: number;
  unpricedRecords: number;
  duplicateMode: 'skip' | 'allow';
  createdAt: string;
}

export interface DuplicateImportPreview {
  requiresDecision: true;
  code: 'DUPLICATES';
  totalRecords: number;
  withinFile: number;
  existing: number;
  totalDuplicates: number;
}

export interface AlertNotification {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  companyName: string;
}

export interface Workspace {
  id: string;
  name: string;
  tier: 'Free' | 'Pro' | 'Enterprise';
}
