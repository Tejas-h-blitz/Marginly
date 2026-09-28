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
    const modelName = modelRaw ? String(modelRaw).trim() : 'default';

    const inputTokensRaw = extractField(r as Record<string, unknown>, ['input_tokens', 'inputTokens', 'prompt_tokens', 'input']) ?? 0;
    const outputTokensRaw = extractField(r as Record<string, unknown>, ['output_tokens', 'outputTokens', 'completion_tokens', 'output']) ?? 0;

    const inputTokens = Math.max(0, parseInt(String(inputTokensRaw), 10) || 0);
    const outputTokens = Math.max(0, parseInt(String(outputTokensRaw), 10) || 0);
    const totalTokens = inputTokens + outputTokens;

    const resolvedModel = normalizeModelName(modelName, pricingKeys);
    const modelPricing = pricingMap[resolvedModel] || pricingMap['default'];
    const { inputCost, outputCost, totalCost } = calculateCost(inputTokens, outputTokens, modelPricing);

    processed.push({
      customerId,
      timestamp,
      modelName,
      resolvedModel,
      inputTokens,
      outputTokens,
      totalTokens,
      inputCost,
      outputCost,
      totalCost
    });
  }

  return processed;
}

export async function saveRecords(records: CalculatedRecord[]): Promise<number> {
  if (records.length === 0) return 0;

  // Group unique customer IDs to upsert
  const uniqueCustomerIds = Array.from(new Set(records.map(r => r.customerId)));

  await db.$transaction(async (tx) => {
    // Upsert all customers
    for (const cid of uniqueCustomerIds) {
      await tx.customer.upsert({
        where: { customerId: cid },
        update: {},
        create: { customerId: cid }
      });
    }

    // Bulk insert usage records
    await tx.usageRecord.createMany({
      data: records.map(r => ({
        customerId: r.customerId,
        timestamp: r.timestamp,
        modelName: r.modelName,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        totalTokens: r.totalTokens,
        inputCost: r.inputCost,
        outputCost: r.outputCost,
        totalCost: r.totalCost
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

export async function getCustomersBreakdown(): Promise<CustomerBreakdown[]> {
  const records = await db.usageRecord.findMany({
    select: {
      customerId: true,
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
      totalCost: true
    }
  });

  if (!records || records.length === 0) {
    return [];
  }

  // Aggregate by customerId
  const customerMap = new Map<string, {
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCost: number;
  }>();

  let overallTotalCost = 0;

  for (const r of records) {
    const existing = customerMap.get(r.customerId) || {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0
    };

    existing.totalRequests += 1;
    existing.totalInputTokens += r.inputTokens;
    existing.totalOutputTokens += r.outputTokens;
    existing.totalTokens += r.totalTokens;
    existing.totalCost += r.totalCost;
    overallTotalCost += r.totalCost;

    customerMap.set(r.customerId, existing);
  }

  const result: CustomerBreakdown[] = [];
  for (const [customerId, data] of customerMap.entries()) {
    const roundedCost = Number(data.totalCost.toFixed(4));
    const avgCost = data.totalRequests > 0 ? Number((data.totalCost / data.totalRequests).toFixed(5)) : 0;
    const pct = overallTotalCost > 0 ? Number(((data.totalCost / overallTotalCost) * 100).toFixed(1)) : 0;

    result.push({
      customerId,
      totalRequests: data.totalRequests,
      totalInputTokens: data.totalInputTokens,
      totalOutputTokens: data.totalOutputTokens,
      totalTokens: data.totalTokens,
      totalCost: roundedCost,
      avgCostPerRequest: avgCost,
      percentOfTotal: pct
    });
  }

  // Sort by totalCost descending
  result.sort((a, b) => b.totalCost - a.totalCost);
  return result;
}

export async function getOverallSummary(): Promise<UsageSummary> {
  const breakdown = await getCustomersBreakdown();

  if (breakdown.length === 0) {
    return {
      totalCustomers: 0,
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      topCustomer: null
    };
  }

  const totalCustomers = breakdown.length;
  let totalRequests = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalTokens = 0;
  let totalCost = 0;

  for (const c of breakdown) {
    totalRequests += c.totalRequests;
    totalInputTokens += c.totalInputTokens;
    totalOutputTokens += c.totalOutputTokens;
    totalTokens += c.totalTokens;
    totalCost += c.totalCost;
  }

  const topCustomer = breakdown.length > 0 ? {
    customerId: breakdown[0].customerId,
    cost: breakdown[0].totalCost
  } : null;

  return {
    totalCustomers,
    totalRequests,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCost: Number(totalCost.toFixed(4)),
    topCustomer
  };
}

export async function clearAllData(): Promise<void> {
  await db.usageRecord.deleteMany();
  await db.customer.deleteMany();
}
