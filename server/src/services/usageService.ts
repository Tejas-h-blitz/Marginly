import { parse } from 'csv-parse/sync';
import { db } from '../db.js';
import { getActivePricing, normalizeModelName, calculateCost } from './pricingService.js';
import { RawUsageInput, CalculatedRecord, CustomerBreakdown, UsageSummary } from '../types/index.js';

function extractField(row: Record<string, unknown>, candidateKeys: string[]): unknown {
  const normalizedRow: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    normalizedRow[k.toLowerCase().replace(/[-_]/g, '')] = v;
  }

  for (const cand of candidateKeys) {
    const norm = cand.toLowerCase().replace(/[-_]/g, '');
    if (norm in normalizedRow) {
      return normalizedRow[norm];
    }
  }
  return undefined;
}

export async function processRawRecords(rawRows: RawUsageInput[]): Promise<CalculatedRecord[]> {
  const pricingMap = await getActivePricing();
  const pricingKeys = Object.keys(pricingMap);
  const processed: CalculatedRecord[] = [];

  for (const r of rawRows) {
    const customerIdRaw = extractField(r as Record<string, unknown>, ['customer_id', 'customerId', 'customer', 'user_id', 'client_id']);
    if (!customerIdRaw) continue;
    const customerId = String(customerIdRaw).trim();

    const timestampRaw = extractField(r as Record<string, unknown>, ['timestamp', 'time', 'date', 'created_at']);
    let timestamp: Date | null = null;
    if (timestampRaw) {
      const d = new Date(String(timestampRaw).trim());
      if (!isNaN(d.getTime())) {
        timestamp = d;
      }
    }

    const modelRaw = extractField(r as Record<string, unknown>, ['model_name', 'modelName', 'model']);
    const modelName = modelRaw ? String(modelRaw).trim() : '(missing model name)';

    const inputTokensRaw = extractField(r as Record<string, unknown>, ['input_tokens', 'inputTokens', 'prompt_tokens', 'input']) ?? 0;
    const outputTokensRaw = extractField(r as Record<string, unknown>, ['output_tokens', 'outputTokens', 'completion_tokens', 'output']) ?? 0;

    const inputTokens = Math.max(0, parseInt(String(inputTokensRaw), 10) || 0);
    const outputTokens = Math.max(0, parseInt(String(outputTokensRaw), 10) || 0);
    const totalTokens = inputTokens + outputTokens;

    const resolvedModel = normalizeModelName(modelName, pricingKeys);
    const modelPricing = resolvedModel ? pricingMap[resolvedModel] : undefined;
    const costs = modelPricing
      ? calculateCost(inputTokens, outputTokens, modelPricing)
      : { inputCost: null, outputCost: null, totalCost: null };

    processed.push({
      customerId,
      timestamp,
      modelName,
      resolvedModel,
      inputTokens,
      outputTokens,
      totalTokens,
      ...costs,
      unpriced: !modelPricing
    });
  }

  return processed;
}

export async function saveRecords(records: CalculatedRecord[], userId: string): Promise<number> {
  if (records.length === 0) return 0;

  // Group unique customer IDs to upsert
  const uniqueCustomerIds = Array.from(new Set(records.map(r => r.customerId)));

  await db.$transaction(async (tx) => {
    // Upsert all customers scoped to this user
    for (const cid of uniqueCustomerIds) {
      await tx.customer.upsert({
        where: {
          userId_customerId: {
            userId,
            customerId: cid
          }
        },
        update: {},
        create: {
          userId,
          customerId: cid
        }
      });
    }

    // Bulk insert usage records scoped to this user
    await tx.usageRecord.createMany({
      data: records.map(r => ({
        userId,
        customerId: r.customerId,
        timestamp: r.timestamp,
        modelName: r.modelName,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens
      }))
    });
  });

  return records.length;
}

export function parseCsv(csvText: string): RawUsageInput[] {
  const records = parse(csvText.trim(), {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return records as RawUsageInput[];
}

export function parseJson(jsonTextOrData: unknown): RawUsageInput[] {
  let data = jsonTextOrData;
  if (typeof jsonTextOrData === 'string') {
    data = JSON.parse(jsonTextOrData);
  }

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    for (const key of ['data', 'records', 'usage', 'items']) {
      if (Array.isArray(obj[key])) {
        data = obj[key];
        break;
      }
    }
  }

  if (!Array.isArray(data)) {
    throw new Error('JSON data must be an array of usage objects.');
  }

  return data as RawUsageInput[];
}

export async function getCustomersBreakdown(userId: string): Promise<CustomerBreakdown[]> {
  const [records, pricing] = await Promise.all([
    db.usageRecord.findMany({ where: { userId } }),
    getActivePricing()
  ]);
  const pricingKeys = Object.keys(pricing);
  const customerMap = new Map<string, {
    totalRequests: number;
    pricedRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCost: number;
  }>();

  for (const record of records) {
    const data = customerMap.get(record.customerId) ?? {
      totalRequests: 0,
      pricedRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0
    };
    data.totalRequests += 1;
    data.totalInputTokens += record.inputTokens;
    data.totalOutputTokens += record.outputTokens;
    data.totalTokens += record.inputTokens + record.outputTokens;

    const resolvedModel = normalizeModelName(record.modelName, pricingKeys);
    const modelPricing = resolvedModel ? pricing[resolvedModel] : undefined;
    if (modelPricing) {
      // Price versioning with effective dates is the proper long-term fix for historical bills.
      data.pricedRequests += 1;
      data.totalCost += calculateCost(record.inputTokens, record.outputTokens, modelPricing).totalCost;
    }

    customerMap.set(record.customerId, data);
  }

  const overallTotalCost = Array.from(customerMap.values())
    .reduce((sum, data) => sum + data.totalCost, 0);

  return Array.from(customerMap, ([customerId, data]) => ({
    customerId,
    totalRequests: data.totalRequests,
    pricedRequests: data.pricedRequests,
    totalInputTokens: data.totalInputTokens,
    totalOutputTokens: data.totalOutputTokens,
    totalTokens: data.totalTokens,
    totalCost: data.totalCost,
    avgCostPerRequest: data.pricedRequests > 0 ? data.totalCost / data.pricedRequests : 0,
    percentOfTotal: overallTotalCost > 0 ? (data.totalCost / overallTotalCost) * 100 : 0
  })).sort((a, b) => b.totalCost - a.totalCost);
}

export async function getOverallSummary(userId: string): Promise<UsageSummary> {
  const [breakdown, records, pricing] = await Promise.all([
    getCustomersBreakdown(userId),
    db.usageRecord.findMany({ where: { userId } }),
    getActivePricing()
  ]);
  const pricingKeys = Object.keys(pricing);
  const unpricedModelCounts = new Map<string, number>();
  for (const record of records) {
    if (!normalizeModelName(record.modelName, pricingKeys)) {
      unpricedModelCounts.set(record.modelName, (unpricedModelCounts.get(record.modelName) ?? 0) + 1);
    }
  }

  const summary: UsageSummary = {
    totalCustomers: breakdown.length,
    totalRequests: 0,
    pricedRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    topCustomer: null,
    unpricedModels: Array.from(unpricedModelCounts, ([modelName, requestCount]) => ({ modelName, requestCount }))
      .sort((a, b) => a.modelName.localeCompare(b.modelName))
  };

  for (const customer of breakdown) {
    summary.totalRequests += customer.totalRequests;
    summary.pricedRequests += customer.pricedRequests;
    summary.totalInputTokens += customer.totalInputTokens;
    summary.totalOutputTokens += customer.totalOutputTokens;
    summary.totalTokens += customer.totalTokens;
    summary.totalCost += customer.totalCost;
  }

  if (breakdown.length > 0) {
    summary.topCustomer = {
      customerId: breakdown[0].customerId,
      cost: breakdown[0].totalCost
    };
  }

  return summary;
}

export async function clearAllData(userId: string): Promise<void> {
  await db.usageRecord.deleteMany({ where: { userId } });
  await db.customer.deleteMany({ where: { userId } });
}
