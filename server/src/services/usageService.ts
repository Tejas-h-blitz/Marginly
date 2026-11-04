import { Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { db } from '../db.js';
import { getActivePricing, normalizeModelName } from './pricingService.js';
import { RawUsageInput, CalculatedRecord, CustomerBreakdown, UsageSummary } from '../types/index.js';
import { calculateTokenCost, monthDateRange, Money, toMoneyString, zeroMoney } from './money.js';

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
    processed.push({
      customerId,
      timestamp,
      modelName,
      resolvedModel,
      inputTokens,
      outputTokens,
      totalTokens,
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

interface CustomerTotals {
  totalRequests: number;
  pricedRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: Money;
}

interface DashboardData {
  customers: CustomerBreakdown[];
  summary: UsageSummary;
}

async function getDashboardData(userId: string, requestedMonth?: string): Promise<DashboardData> {
  const [allRecords, storedCustomers, pricing] = await Promise.all([
    db.usageRecord.findMany({ where: { userId } }),
    db.customer.findMany({ where: { userId } }),
    getActivePricing()
  ]);
  const availableMonths = Array.from(new Set(
    allRecords.flatMap(record => record.timestamp ? [record.timestamp.toISOString().slice(0, 7)] : [])
  )).sort();
  const month = requestedMonth ?? availableMonths[availableMonths.length - 1] ?? 'all';
  const dateRange = month === 'all' ? null : monthDateRange(month);
  const periodRecords = month === 'all'
    ? allRecords
    : allRecords.filter(record => record.timestamp && dateRange &&
      record.timestamp >= dateRange.gte && record.timestamp < dateRange.lt);
  const pricingKeys = Object.keys(pricing);
  const totalsByCustomer = new Map<string, CustomerTotals>();
  const unpricedModelCounts = new Map<string, number>();
  let pricedRequests = 0;

  for (const customer of storedCustomers) {
    totalsByCustomer.set(customer.customerId, {
      totalRequests: 0,
      pricedRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: zeroMoney()
    });
  }

  for (const record of periodRecords) {
    const totals = totalsByCustomer.get(record.customerId);
    if (!totals) continue;

    totals.totalRequests += 1;
    totals.totalInputTokens += record.inputTokens;
    totals.totalOutputTokens += record.outputTokens;
    totals.totalTokens += record.inputTokens + record.outputTokens;

    const resolvedModel = normalizeModelName(record.modelName, pricingKeys);
    const modelPricing = resolvedModel ? pricing[resolvedModel] : undefined;
    if (modelPricing) {
      pricedRequests += 1;
      totals.pricedRequests += 1;
      // Price versioning with effective dates is the proper long-term fix for historical accuracy.
      totals.totalCost = totals.totalCost.plus(
        calculateTokenCost(record.inputTokens, record.outputTokens, modelPricing)
      );
    } else {
      unpricedModelCounts.set(record.modelName, (unpricedModelCounts.get(record.modelName) ?? 0) + 1);
    }
  }

  const totalCost = Array.from(totalsByCustomer.values())
    .reduce((sum, totals) => sum.plus(totals.totalCost), zeroMoney());
  const customerBreakdown = storedCustomers.map(customer => {
    const totals = totalsByCustomer.get(customer.customerId)!;
    const revenue = customer.monthlyRevenueUsd === null
      ? null
      : new Prisma.Decimal(customer.monthlyRevenueUsd);
    const margin = month === 'all' || revenue === null ? null : revenue.minus(totals.totalCost);

    return {
      customerId: customer.customerId,
      monthlyRevenueUsd: customer.monthlyRevenueUsd,
      totalRequests: totals.totalRequests,
      pricedRequests: totals.pricedRequests,
      totalInputTokens: totals.totalInputTokens,
      totalOutputTokens: totals.totalOutputTokens,
      totalTokens: totals.totalTokens,
      totalCost: toMoneyString(totals.totalCost),
      avgCostPerRequest: toMoneyString(totals.pricedRequests
        ? totals.totalCost.div(totals.pricedRequests)
        : zeroMoney()),
      percentOfTotal: toMoneyString(totalCost.isZero()
        ? zeroMoney()
        : totals.totalCost.mul(100).div(totalCost)),
      marginUsd: margin === null ? null : toMoneyString(margin),
      marginPercent: month === 'all' || revenue === null || revenue.isZero() || margin === null
        ? null
        : toMoneyString(margin.mul(100).div(revenue)),
      unprofitable: margin !== null && margin.isNegative()
    };
  }).sort((a, b) => {
    const aCost = new Prisma.Decimal(a.totalCost);
    const bCost = new Prisma.Decimal(b.totalCost);
    return bCost.comparedTo(aCost);
  });

  const totalRevenue = month === 'all'
    ? null
    : storedCustomers.reduce(
      (sum, customer) => customer.monthlyRevenueUsd === null
        ? sum
        : sum.plus(customer.monthlyRevenueUsd),
      zeroMoney()
    );
  const totalMargin = totalRevenue === null
    ? null
    : customerBreakdown.reduce(
      (sum, customer) => customer.marginUsd === null ? sum : sum.plus(customer.marginUsd),
      zeroMoney()
    );
  const totalRequests = periodRecords.length;
  const unprofitableCustomers = month === 'all'
    ? 0
    : customerBreakdown.filter(customer => customer.unprofitable).length;
  const topCustomer = customerBreakdown.find(customer => customer.totalRequests > 0);

  return {
    customers: customerBreakdown,
    summary: {
      month,
      availableMonths,
      untimestampedRequests: allRecords.filter(record => record.timestamp === null).length,
      totalCustomers: storedCustomers.length,
      totalRequests,
      pricedRequests,
      totalInputTokens: periodRecords.reduce((sum, record) => sum + record.inputTokens, 0),
      totalOutputTokens: periodRecords.reduce((sum, record) => sum + record.outputTokens, 0),
      totalTokens: periodRecords.reduce((sum, record) => sum + record.inputTokens + record.outputTokens, 0),
      totalCost: toMoneyString(totalCost),
      avgCostPerRequest: toMoneyString(pricedRequests > 0
        ? totalCost.div(pricedRequests)
        : zeroMoney()),
      totalRevenueUsd: totalRevenue === null ? null : toMoneyString(totalRevenue),
      totalMarginUsd: totalMargin === null ? null : toMoneyString(totalMargin),
      blendedMarginPercent: totalRevenue === null || totalRevenue.isZero() || totalMargin === null
        ? null
        : toMoneyString(totalMargin.mul(100).div(totalRevenue)),
      unprofitableCustomers,
      topCustomer: topCustomer
        ? { customerId: topCustomer.customerId, cost: topCustomer.totalCost }
        : null,
      unpricedModels: Array.from(unpricedModelCounts, ([modelName, requestCount]) => ({ modelName, requestCount }))
        .sort((a, b) => a.modelName.localeCompare(b.modelName))
    }
  };
}

export async function getCustomersBreakdown(userId: string, month?: string): Promise<CustomerBreakdown[]> {
  return (await getDashboardData(userId, month)).customers;
}

export async function getOverallSummary(userId: string, month?: string): Promise<UsageSummary> {
  return (await getDashboardData(userId, month)).summary;
}

export async function getAvailableMonths(userId: string): Promise<string[]> {
  const records = await db.usageRecord.findMany({ where: { userId } });
  return Array.from(new Set(
    records.flatMap(record => record.timestamp ? [record.timestamp.toISOString().slice(0, 7)] : [])
  )).sort();
}

export async function updateCustomerRevenue(
  userId: string,
  customerId: string,
  monthlyRevenueUsd: string | null
): Promise<void> {
  const result = await db.customer.updateMany({
    where: { userId, customerId },
    data: { monthlyRevenueUsd }
  });
  if (result.count === 0) {
    throw new Error('Customer not found for this account.');
  }
}

export async function importCustomerRevenue(
  userId: string,
  rows: Array<{ customerId: string; monthlyRevenueUsd: string }>
): Promise<number> {
  await db.$transaction(async tx => {
    const customers = await tx.customer.findMany({ where: { userId } });
    const ownedIds = new Set(customers.map(customer => customer.customerId));
    const missingIds = Array.from(new Set(rows
      .filter(row => !ownedIds.has(row.customerId))
      .map(row => row.customerId)));
    if (missingIds.length > 0) {
      throw new Error(`Unknown customer IDs: ${missingIds.join(', ')}`);
    }

    for (const row of rows) {
      await tx.customer.updateMany({
        where: { userId, customerId: row.customerId },
        data: { monthlyRevenueUsd: row.monthlyRevenueUsd }
      });
    }
  });
  return rows.length;
}

export async function clearAllData(userId: string): Promise<void> {
  await db.usageRecord.deleteMany({ where: { userId } });
  await db.customer.deleteMany({ where: { userId } });
}
