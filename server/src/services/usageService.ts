import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { db } from '../db.js';
import { getActivePricing, getUsageCosts, normalizeModelIdentifier, normalizeModelName } from './pricingService.js';
import { RawUsageInput, CalculatedRecord, CustomerBreakdown, UsageSummary } from '../types/index.js';
import { monthDateRange, Money, toMoneyString, zeroMoney } from './money.js';

export class UsageImportValidationError extends Error {
  constructor(
    public readonly rejectedRows: string[],
    public readonly rejectedCount: number
  ) {
    super(`${rejectedCount} usage row${rejectedCount === 1 ? '' : 's'} failed validation.`);
  }
}

export interface ImportHistoryItem {
  id: string;
  sourceName: string;
  sourceType: string;
  totalRecords: number;
  insertedRecords: number;
  duplicateRecords: number;
  withinFileDuplicates: number;
  unpricedRecords: number;
  duplicateMode: 'skip' | 'allow';
  createdAt: string;
}

export interface UsageImportResult {
  insertedRecords: number;
  duplicateRecords: number;
  unpricedRecords: number;
  batch: ImportHistoryItem;
  summary: UsageSummary;
  sampleDataRemoved: boolean;
  withinFileDuplicates: number;
  duplicateMode: 'skip' | 'allow';
}

export interface DuplicateImportPreview {
  requiresDecision: true;
  code: 'DUPLICATES';
  totalRecords: number;
  withinFile: number;
  existing: number;
  totalDuplicates: number;
}

export type UsageImportResponse = UsageImportResult | DuplicateImportPreview;

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
    unpricedRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCost: string;
  }>;
  byDay: Array<{
    date: string | null;
    requests: number;
    pricedRequests: number;
    unpricedRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
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

export interface CustomerMergeResult {
  sourceCustomerId: string;
  targetCustomerId: string;
  movedRequests: number;
  duplicateRequestsRemoved: number;
  copiedRevenueVersions: number;
  revenueConflicts: number;
}

interface ImportHistoryRow {
  id: string;
  sourceName: string;
  sourceType: string;
  totalRecords: number;
  insertedRecords: number;
  duplicateRecords: number;
  withinFileDuplicates: number;
  unpricedRecords: number;
  duplicateMode: 'skip' | 'allow';
  createdAt: Date | string;
}

const IMPORT_CHUNK_SIZE = 1000;

type DuplicateMode = 'detect' | 'skip' | 'allow';

interface SaveImportedRecordsResult {
  batch: ImportHistoryItem | null;
  preview?: DuplicateImportPreview;
  sampleDataRemoved: boolean;
}

function getRecordFingerprint(record: CalculatedRecord): string | null {
  if (!record.timestamp) return null;
  return crypto.createHash('sha256').update(JSON.stringify([
    record.customerId,
    record.timestamp.toISOString(),
    record.modelName,
    record.inputTokens,
    record.outputTokens
  ])).digest('hex');
}

interface RevenueVersionRow {
  customerId: string;
  monthlyRevenueUsd: string | null;
}

export function parseUtcTimestamp(raw: unknown): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  let text = String(raw).trim();
  if (!text) return null;
  if (/^\d{10,13}$/.test(text)) {
    const num = parseInt(text, 10);
    const ms = text.length === 10 ? num * 1000 : num;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(text)) {
    text = text.replace(/\s+/, 'T');
  }
  const hasTimezone = /[zZ]$|[+-]\d{2}(?::?\d{2})?$/.test(text);
  if (!hasTimezone && /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/.test(text)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      text = text + 'T00:00:00.000Z';
    } else {
      text = text + 'Z';
    }
  }
  const d = new Date(text);
  return isNaN(d.getTime()) ? null : d;
}

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
  const { models: pricingMap } = await getActivePricing('__global__');
  const pricingKeys = Object.keys(pricingMap);
  const processed: CalculatedRecord[] = [];
  const rejectedRows: string[] = [];

  for (const [index, r] of rawRows.entries()) {
    const rowNumber = index + 2;
    if (!r || typeof r !== 'object' || Array.isArray(r)) {
      rejectedRows.push(`Row ${rowNumber}: expected a usage record object.`);
      continue;
    }
    const customerIdRaw = extractField(r as Record<string, unknown>, ['customer_id', 'customerId', 'customer', 'user_id', 'client_id']);
    const customerId = customerIdRaw == null ? '' : String(customerIdRaw).trim();
    if (!customerId) {
      rejectedRows.push(`Row ${rowNumber}: customer_id is required.`);
      continue;
    }
    if (customerId.length > 200) {
      rejectedRows.push(`Row ${rowNumber}: customer_id must be 200 characters or fewer.`);
      continue;
    }

    const timestampRaw = extractField(r as Record<string, unknown>, ['timestamp', 'time', 'date', 'created_at']);
    const timestamp = parseUtcTimestamp(timestampRaw);
    if (timestampRaw != null && String(timestampRaw).trim() && timestamp === null) {
      rejectedRows.push(`Row ${rowNumber}: timestamp must be a valid ISO date or Unix timestamp.`);
      continue;
    }

    const modelRaw = extractField(r as Record<string, unknown>, ['model_name', 'modelName', 'model', 'engine']);
    const modelName = typeof modelRaw === 'string' ? modelRaw.trim() : '';
    if (!modelName) {
      rejectedRows.push(`Row ${rowNumber}: model_name is required and must be a non-empty string.`);
      continue;
    }
    if (modelName.length > 200) {
      rejectedRows.push(`Row ${rowNumber}: model_name must be 200 characters or fewer.`);
      continue;
    }

    const inputTokensRaw = extractField(r as Record<string, unknown>, [
      'input_tokens', 'inputTokens', 'prompt_tokens', 'tokens_in', 'input'
    ]);
    const outputTokensRaw = extractField(r as Record<string, unknown>, [
      'output_tokens', 'outputTokens', 'completion_tokens', 'tokens_out', 'output'
    ]);

    if (inputTokensRaw == null || outputTokensRaw == null ||
        (typeof inputTokensRaw === 'string' && !inputTokensRaw.trim()) ||
        (typeof outputTokensRaw === 'string' && !outputTokensRaw.trim())) {
      rejectedRows.push(`Row ${rowNumber}: input_tokens and output_tokens are required.`);
      continue;
    }
    const inputTokens = parseTokenCount(inputTokensRaw);
    const outputTokens = parseTokenCount(outputTokensRaw);
    if (inputTokens === null || outputTokens === null) {
      rejectedRows.push(`Row ${rowNumber}: token counts must be non-negative whole numbers no greater than 2,147,483,647.`);
      continue;
    }
    const totalTokens = inputTokens + outputTokens;

    const resolvedModel = normalizeModelName(modelName, pricingKeys);
    const modelPricing = resolvedModel ? pricingMap[resolvedModel] : undefined;
    const normalizedModelName = normalizeModelIdentifier(modelName, pricingKeys) ?? '';
    processed.push({
      customerId,
      timestamp,
      modelName,
      normalizedModelName,
      resolvedModel,
      inputTokens,
      outputTokens,
      totalTokens,
      unpriced: !modelPricing
    });
  }

  if (rejectedRows.length > 0) {
    throw new UsageImportValidationError(rejectedRows.slice(0, 100), rejectedRows.length);
  }

  return processed;
}

function parseTokenCount(value: unknown): number | null {
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return 0;
    if (!/^\d+$/.test(text)) return null;
    value = Number(text);
  }
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 2_147_483_647) {
    return null;
  }
  return value;
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

export async function saveImportedRecords(
  records: CalculatedRecord[],
  userId: string,
  source: {
    sourceName: string;
    sourceType: 'upload' | 'paste' | 'sample';
    duplicateMode: DuplicateMode;
  }
): Promise<SaveImportedRecordsResult> {
  const batchId = crypto.randomUUID();
  const importRows = records.map((record, ordinal) => ({
    ordinal,
    fingerprint: getRecordFingerprint(record),
    customerId: record.customerId,
    timestamp: record.timestamp?.toISOString() ?? null,
    modelName: record.modelName,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    unpriced: record.unpriced
  }));
  const firstOrdinalByFingerprint = new Map<string, number>();
  const withinFileOrdinals = new Set<number>();
  for (const row of importRows) {
    if (!row.fingerprint) continue;
    const firstOrdinal = firstOrdinalByFingerprint.get(row.fingerprint);
    if (firstOrdinal === undefined) {
      firstOrdinalByFingerprint.set(row.fingerprint, row.ordinal);
    } else {
      withinFileOrdinals.add(row.ordinal);
    }
  }
  const withinFileDuplicates = withinFileOrdinals.size;
  const sourceName = source.sourceName.trim().slice(0, 200) || 'Usage import';
  return db.$transaction(async tx => {
    const existingOrdinals = new Set<number>();
    const omitSampleRows = source.sourceType !== 'sample'
      ? `AND NOT EXISTS (
           SELECT 1
           FROM import_batches AS sample_batch
           WHERE sample_batch.id = existing.import_batch_id
             AND sample_batch.user_id = $2
             AND sample_batch.source_type = 'sample'
         )`
      : '';

    for (let offset = 0; offset < importRows.length; offset += IMPORT_CHUNK_SIZE) {
      const chunk = importRows.slice(offset, offset + IMPORT_CHUNK_SIZE)
        .filter(row => row.fingerprint !== null && !withinFileOrdinals.has(row.ordinal));
      if (chunk.length === 0) continue;
      const matches = await tx.$queryRaw<{ ordinal: number }>(
        `WITH incoming AS (
           SELECT *
           FROM jsonb_to_recordset($1::jsonb) AS row_data(
             ordinal integer,
             fingerprint text,
             "customerId" text,
             "timestamp" timestamptz,
             "modelName" text,
             "inputTokens" integer,
             "outputTokens" integer,
             unpriced boolean
           )
         )
         SELECT incoming.ordinal
         FROM incoming
         WHERE EXISTS (
           SELECT 1
           FROM usage_records AS existing
           WHERE existing.user_id = $2
             AND existing.customer_id = incoming."customerId"
             AND existing.timestamp = incoming."timestamp"
             AND existing.model_name = incoming."modelName"
             AND existing.input_tokens = incoming."inputTokens"
             AND existing.output_tokens = incoming."outputTokens"
             ${omitSampleRows}
         );`,
        JSON.stringify(chunk),
        userId
      );
      for (const match of matches) existingOrdinals.add(Number(match.ordinal));
    }

    const existingDuplicates = existingOrdinals.size;
    const totalDuplicates = withinFileDuplicates + existingDuplicates;
    if (source.duplicateMode === 'detect' && totalDuplicates > 0) {
      return {
        batch: null,
        preview: {
          requiresDecision: true,
          code: 'DUPLICATES',
          totalRecords: records.length,
          withinFile: withinFileDuplicates,
          existing: existingDuplicates,
          totalDuplicates
        },
        sampleDataRemoved: false
      };
    }

    let sampleDataRemoved = false;
    if (source.sourceType !== 'sample') {
      const sampleRows = await tx.$queryRaw<{ removedBatches: number }>(
        `WITH removed_usage AS (
           DELETE FROM usage_records
           WHERE user_id = $1
             AND import_batch_id IN (
               SELECT id FROM import_batches
               WHERE user_id = $1 AND source_type = 'sample'
             )
           RETURNING id
         ),
         removed_batches AS (
           DELETE FROM import_batches
           WHERE user_id = $1 AND source_type = 'sample'
           RETURNING id
         )
         SELECT COUNT(*)::integer AS "removedBatches" FROM removed_batches;`,
        userId
      );
      sampleDataRemoved = Number(sampleRows[0]?.removedBatches ?? 0) > 0;
      if (sampleDataRemoved) {
        await tx.$queryRaw(
          `DELETE FROM customers AS customer
           WHERE customer.user_id = $1
             AND customer.monthly_revenue_usd IS NULL
             AND NOT EXISTS (
               SELECT 1 FROM usage_records
               WHERE user_id = customer.user_id AND customer_id = customer.customer_id
             )
             AND NOT EXISTS (
               SELECT 1 FROM revenue_versions
               WHERE user_id = customer.user_id AND customer_id = customer.customer_id
             )
           RETURNING customer.id;`,
          userId
        );
      }
    }

    const selectedRows = source.duplicateMode === 'allow'
      ? importRows
      : importRows.filter(row =>
          !withinFileOrdinals.has(row.ordinal) && !existingOrdinals.has(row.ordinal)
        );
    const skippedDuplicates = records.length - selectedRows.length;
    const unpricedRecords = selectedRows.filter(row => row.unpriced).length;

    const batchRows = await tx.$queryRaw<ImportHistoryRow>(
      `INSERT INTO import_batches (
         id, user_id, source_name, source_type, total_records,
         inserted_records, duplicate_records, within_file_duplicates,
         unpriced_records, duplicate_mode
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING
         id,
         source_name AS "sourceName",
         source_type AS "sourceType",
         total_records AS "totalRecords",
         inserted_records AS "insertedRecords",
         duplicate_records AS "duplicateRecords",
         within_file_duplicates AS "withinFileDuplicates",
         unpriced_records AS "unpricedRecords",
         duplicate_mode AS "duplicateMode",
         created_at AS "createdAt";`,
      batchId,
      userId,
      sourceName,
      source.sourceType,
      records.length,
      selectedRows.length,
      source.duplicateMode === 'allow' ? totalDuplicates : skippedDuplicates,
      withinFileDuplicates,
      unpricedRecords,
      source.duplicateMode === 'allow' ? 'allow' : 'skip'
    );
    const batchRow = batchRows[0];
    if (!batchRow) throw new Error('Usage import history could not be recorded.');

    for (let offset = 0; offset < selectedRows.length; offset += IMPORT_CHUNK_SIZE) {
      const chunk = selectedRows.slice(offset, offset + IMPORT_CHUNK_SIZE);
      const payload = JSON.stringify(chunk);
      await tx.$queryRaw(
        `WITH incoming AS (
           SELECT *
           FROM jsonb_to_recordset($1::jsonb) AS row_data(
             ordinal integer,
             fingerprint text,
             "customerId" text,
             "timestamp" timestamptz,
             "modelName" text,
             "inputTokens" integer,
             "outputTokens" integer,
             unpriced boolean
           )
         ),
         upserted_customers AS (
           INSERT INTO customers (id, user_id, customer_id, updated_at)
           SELECT gen_random_uuid()::text, $2, incoming."customerId", NOW()
           FROM incoming
           GROUP BY incoming."customerId"
           ON CONFLICT (user_id, customer_id) DO NOTHING
           RETURNING customer_id
         ),
         customer_ids AS (
           SELECT customer_id FROM upserted_customers
           UNION
           SELECT customer.customer_id
           FROM customers AS customer
           JOIN incoming ON incoming."customerId" = customer.customer_id
           WHERE customer.user_id = $2
         )
         INSERT INTO usage_records (
           id, user_id, customer_id, timestamp, model_name,
           input_tokens, output_tokens, record_fingerprint, import_batch_id
         )
         SELECT
           gen_random_uuid()::text,
           $2,
           incoming."customerId",
           incoming."timestamp",
           incoming."modelName",
           incoming."inputTokens",
           incoming."outputTokens",
           incoming.fingerprint,
           $3
         FROM incoming
         JOIN customer_ids ON customer_ids.customer_id = incoming."customerId"
         RETURNING id;`,
        payload,
        userId,
        batchId
      );
    }

    return {
      batch: {
        ...batchRow,
        totalRecords: Number(batchRow.totalRecords),
        insertedRecords: Number(batchRow.insertedRecords),
        duplicateRecords: Number(batchRow.duplicateRecords),
        withinFileDuplicates: Number(batchRow.withinFileDuplicates),
        unpricedRecords: Number(batchRow.unpricedRecords),
        createdAt: new Date(batchRow.createdAt).toISOString()
      },
      sampleDataRemoved
    };
  });
}

export async function importUsageRecords(
  rawRows: RawUsageInput[],
  userId: string,
  source: {
    sourceName: string;
    sourceType: 'upload' | 'paste' | 'sample';
    duplicateMode?: DuplicateMode;
  }
): Promise<UsageImportResponse> {
  if (rawRows.length === 0) {
    throw new UsageImportValidationError(['No usage records were found.'], 1);
  }
  const records = await processRawRecords(rawRows);
  const costs = await getUsageCosts(userId, records.map(record => ({
    modelName: record.normalizedModelName,
    timestamp: record.timestamp,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens
  })));
  const recordsWithPricing = records.map((record, index) => ({
    ...record,
    unpriced: costs[index]?.cost == null
  }));
  const duplicateMode = source.sourceType === 'sample' ? 'skip' : source.duplicateMode ?? 'detect';
  const saved = await saveImportedRecords(recordsWithPricing, userId, {
    ...source,
    duplicateMode
  });
  if (saved.preview) return saved.preview;
  if (!saved.batch) throw new Error('Usage import did not produce an import batch.');
  const summary = await getOverallSummary(userId);
  return {
    insertedRecords: saved.batch.insertedRecords,
    duplicateRecords: saved.batch.duplicateRecords,
    unpricedRecords: saved.batch.unpricedRecords,
    batch: saved.batch,
    summary,
    sampleDataRemoved: saved.sampleDataRemoved,
    withinFileDuplicates: saved.batch.withinFileDuplicates,
    duplicateMode: duplicateMode === 'allow' ? 'allow' : 'skip'
  };
}

export async function getImportHistory(userId: string): Promise<ImportHistoryItem[]> {
  const rows = await db.$queryRaw<ImportHistoryRow>(
    `SELECT
       id,
       source_name AS "sourceName",
       source_type AS "sourceType",
       total_records AS "totalRecords",
       inserted_records AS "insertedRecords",
       duplicate_records AS "duplicateRecords",
       within_file_duplicates AS "withinFileDuplicates",
       unpriced_records AS "unpricedRecords",
       duplicate_mode AS "duplicateMode",
       created_at AS "createdAt"
     FROM import_batches
     WHERE user_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 20;`,
    userId
  );
  return rows.map(row => ({
    ...row,
    totalRecords: Number(row.totalRecords),
    insertedRecords: Number(row.insertedRecords),
    duplicateRecords: Number(row.duplicateRecords),
    withinFileDuplicates: Number(row.withinFileDuplicates),
    unpricedRecords: Number(row.unpricedRecords),
    createdAt: new Date(row.createdAt).toISOString()
  }));
}

export async function undoImportBatch(
  userId: string,
  batchId: string
): Promise<{ sourceName: string; removedRecords: number } | null> {
  if (!batchId || batchId.length > 200) return null;
  return db.$transaction(async tx => {
    const batchRows = await tx.$queryRaw<{ sourceName: string }>(
      'SELECT source_name AS "sourceName" FROM import_batches WHERE id = $1 AND user_id = $2;',
      batchId,
      userId
    );
    if (!batchRows[0]) return null;
    const deleted = await tx.$queryRaw<{ id: string }>(
      'DELETE FROM usage_records WHERE user_id = $1 AND import_batch_id = $2 RETURNING id;',
      userId,
      batchId
    );
    await tx.$queryRaw(
      'DELETE FROM import_batches WHERE id = $1 AND user_id = $2 RETURNING id;',
      batchId,
      userId
    );
    await tx.$queryRaw(
      `DELETE FROM customers AS customer
       WHERE customer.user_id = $1
         AND customer.monthly_revenue_usd IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM usage_records
           WHERE user_id = customer.user_id AND customer_id = customer.customer_id
         )
         AND NOT EXISTS (
           SELECT 1 FROM revenue_versions
           WHERE user_id = customer.user_id AND customer_id = customer.customer_id
         )
       RETURNING customer.id;`,
      userId
    );
    return { sourceName: batchRows[0].sourceName, removedRecords: deleted.length };
  });
}

export function parseCsv(csvText: string): RawUsageInput[] {
  const records = parse(csvText.replace(/^\uFEFF/, '').trim(), {
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
  const [allRecords, storedCustomers, pricingCatalog] = await Promise.all([
    db.usageRecord.findMany({ where: { userId } }),
    db.customer.findMany({ where: { userId } }),
    getActivePricing(userId)
  ]);
  const pricing = pricingCatalog.models;
  const availableMonths = Array.from(new Set(
    allRecords.flatMap(record => record.timestamp ? [record.timestamp.toISOString().slice(0, 7)] : [])
  )).sort();
  const month = requestedMonth ?? availableMonths[availableMonths.length - 1] ?? 'all';
  const dateRange = month === 'all' ? null : monthDateRange(month);
  const revenueMonth = month === 'all' ? new Date().toISOString().slice(0, 7) : month;
  const revenueRows = await db.$queryRaw<RevenueVersionRow>(
    `SELECT DISTINCT ON (customer_id)
       customer_id AS "customerId",
       monthly_revenue_usd::text AS "monthlyRevenueUsd"
     FROM revenue_versions
     WHERE user_id = $1
       AND effective_month <= $2::date
     ORDER BY customer_id, effective_month DESC;`,
    userId,
    `${revenueMonth}-01`
  );
  const revenueByCustomer = new Map(
    revenueRows.map(row => [row.customerId, row.monthlyRevenueUsd])
  );
  const periodRecords = month === 'all'
    ? allRecords
    : allRecords.filter(record => {
        if (!record.timestamp || !dateRange) return false;
        const time = record.timestamp.getTime();
        return time >= dateRange.gte.getTime() && time < dateRange.lt.getTime();
      });
  const pricingKeys = Object.keys(pricing);
  const periodRecordSet = new Set(periodRecords);
  const usageCosts = await getUsageCosts(userId, allRecords.map(record => ({
    modelName: normalizeModelIdentifier(record.modelName, pricingKeys) ?? '',
    timestamp: record.timestamp,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens
  })));
  const costsByRecord = new Map(usageCosts.map(record => [record.ordinal, record.cost]));
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

  for (const [index, record] of allRecords.entries()) {
    if (!periodRecordSet.has(record)) continue;
    const totals = totalsByCustomer.get(record.customerId);
    if (!totals) continue;

    totals.totalRequests += 1;
    totals.totalInputTokens += record.inputTokens;
    totals.totalOutputTokens += record.outputTokens;
    totals.totalTokens += record.inputTokens + record.outputTokens;

    const cost = costsByRecord.get(index);
    if (cost !== null && cost !== undefined) {
      pricedRequests += 1;
      totals.pricedRequests += 1;
      // Price versioning with effective dates is the proper long-term fix for historical accuracy.
      totals.totalCost = totals.totalCost.plus(new Prisma.Decimal(cost));
    } else {
      unpricedModelCounts.set(record.modelName, (unpricedModelCounts.get(record.modelName) ?? 0) + 1);
    }
  }

  const totalCost = Array.from(totalsByCustomer.values())
    .reduce((sum, totals) => sum.plus(totals.totalCost), zeroMoney());
  const customerBreakdown = storedCustomers.map(customer => {
    const totals = totalsByCustomer.get(customer.customerId)!;
    const monthlyRevenueUsd = revenueByCustomer.get(customer.customerId) ?? null;
    const revenue = monthlyRevenueUsd === null
      ? null
      : new Prisma.Decimal(monthlyRevenueUsd);
    const margin = month === 'all' || revenue === null ? null : revenue.minus(totals.totalCost);

    return {
      customerId: customer.customerId,
      monthlyRevenueUsd,
      totalRequests: totals.totalRequests,
      pricedRequests: totals.pricedRequests,
      unpricedRequests: totals.totalRequests - totals.pricedRequests,
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

  const activeBreakdown = month === 'all'
    ? customerBreakdown
    : customerBreakdown.filter(customer => customer.totalRequests > 0);

  const totalRevenue = month === 'all'
    ? null
    : activeBreakdown.reduce(
      (sum, customer) => customer.monthlyRevenueUsd === null
        ? sum
        : sum.plus(customer.monthlyRevenueUsd),
      zeroMoney()
    );
  const hasMargin = activeBreakdown.some(customer => customer.marginUsd !== null);
  const totalMargin = totalRevenue === null || !hasMargin
    ? null
    : activeBreakdown.reduce(
      (sum, customer) => customer.marginUsd === null ? sum : sum.plus(customer.marginUsd),
      zeroMoney()
    );
  const totalRequests = periodRecords.length;
  const unprofitableCustomers = month === 'all'
    ? 0
    : activeBreakdown.filter(customer => customer.unprofitable).length;
  const topCustomer = activeBreakdown.find(customer => customer.totalRequests > 0);

  return {
    customers: activeBreakdown,
    summary: {
      month,
      availableMonths,
      untimestampedRequests: allRecords.filter(record => record.timestamp === null).length,
      totalCustomers: activeBreakdown.length,
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

export async function getCustomerDetail(
  userId: string,
  customerId: string,
  requestedMonth = 'all'
): Promise<CustomerDetail | null> {
  const owned = await db.$queryRaw<{ customerId: string }>(
    'SELECT customer_id AS "customerId" FROM customers WHERE user_id = $1 AND customer_id = $2;',
    userId,
    customerId
  );
  if (owned.length === 0) return null;

  const [records, revenueHistory, pricingCatalog] = await Promise.all([
    db.$queryRaw<{
      timestamp: Date | string | null;
      modelName: string;
      inputTokens: number;
      outputTokens: number;
    }>(
      `SELECT timestamp, model_name AS "modelName",
         input_tokens AS "inputTokens", output_tokens AS "outputTokens"
       FROM usage_records
       WHERE user_id = $1 AND customer_id = $2
       ORDER BY timestamp DESC NULLS LAST;`,
      userId,
      customerId
    ),
    db.$queryRaw<{
      effectiveMonth: Date | string;
      monthlyRevenueUsd: string | null;
    }>(
      `SELECT effective_month AS "effectiveMonth",
         monthly_revenue_usd::text AS "monthlyRevenueUsd"
       FROM revenue_versions
       WHERE user_id = $1 AND customer_id = $2
       ORDER BY effective_month DESC;`,
      userId,
      customerId
    ),
    getActivePricing(userId)
  ]);
  const dateRange = requestedMonth === 'all' ? null : monthDateRange(requestedMonth);
  const periodRecords = records.filter(record => {
    if (!dateRange) return true;
    if (!record.timestamp) return false;
    const time = new Date(record.timestamp).getTime();
    return time >= dateRange.gte.getTime() && time < dateRange.lt.getTime();
  });
  const pricingKeys = Object.keys(pricingCatalog.models);
  const costs = await getUsageCosts(userId, periodRecords.map(record => ({
    modelName: normalizeModelIdentifier(record.modelName, pricingKeys) ?? '',
    timestamp: record.timestamp ? new Date(record.timestamp) : null,
    inputTokens: Number(record.inputTokens),
    outputTokens: Number(record.outputTokens)
  })));
  const modelTotals = new Map<string, {
    requests: number;
    pricedRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: Money;
  }>();
  const dayTotals = new Map<string, {
    date: string | null;
    requests: number;
    pricedRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: Money;
  }>();
  const recentUsage = periodRecords.slice(0, 20).map((record, ordinal) => ({
    timestamp: record.timestamp ? new Date(record.timestamp).toISOString() : null,
    modelName: record.modelName,
    inputTokens: Number(record.inputTokens),
    outputTokens: Number(record.outputTokens),
    cost: costs[ordinal]?.cost ?? null
  }));
  let pricedRequests = 0;
  let totalCost = zeroMoney();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const [ordinal, record] of periodRecords.entries()) {
    const modelName = record.modelName;
    const totals = modelTotals.get(modelName) ?? {
      requests: 0,
      pricedRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: zeroMoney()
    };
    const inputTokens = Number(record.inputTokens);
    const outputTokens = Number(record.outputTokens);
    const date = record.timestamp
      ? new Date(record.timestamp).toISOString().slice(0, 10)
      : null;
    const dayKey = date ?? '';
    const day = dayTotals.get(dayKey) ?? {
      date,
      requests: 0,
      pricedRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: zeroMoney()
    };
    totals.requests += 1;
    totals.totalInputTokens += inputTokens;
    totals.totalOutputTokens += outputTokens;
    day.requests += 1;
    day.totalInputTokens += inputTokens;
    day.totalOutputTokens += outputTokens;
    totalInputTokens += inputTokens;
    totalOutputTokens += outputTokens;
    const cost = costs[ordinal]?.cost;
    if (cost !== null && cost !== undefined) {
      const money = new Prisma.Decimal(cost);
      totals.pricedRequests += 1;
      totals.totalCost = totals.totalCost.plus(money);
      day.pricedRequests += 1;
      day.totalCost = day.totalCost.plus(money);
      totalCost = totalCost.plus(money);
      pricedRequests += 1;
    }
    modelTotals.set(modelName, totals);
    dayTotals.set(dayKey, day);
  }

  return {
    customerId,
    month: requestedMonth,
    totalRequests: periodRecords.length,
    pricedRequests,
    unpricedRequests: periodRecords.length - pricedRequests,
    totalInputTokens,
    totalOutputTokens,
    totalCost: toMoneyString(totalCost),
    models: Array.from(modelTotals, ([modelName, totals]) => ({
      modelName,
      requests: totals.requests,
      pricedRequests: totals.pricedRequests,
      unpricedRequests: totals.requests - totals.pricedRequests,
      totalInputTokens: totals.totalInputTokens,
      totalOutputTokens: totals.totalOutputTokens,
      totalTokens: totals.totalInputTokens + totals.totalOutputTokens,
      totalCost: toMoneyString(totals.totalCost)
    })).sort((a, b) => new Prisma.Decimal(b.totalCost).comparedTo(a.totalCost)),
    byDay: Array.from(dayTotals.values(), day => ({
      date: day.date,
      requests: day.requests,
      pricedRequests: day.pricedRequests,
      unpricedRequests: day.requests - day.pricedRequests,
      totalInputTokens: day.totalInputTokens,
      totalOutputTokens: day.totalOutputTokens,
      totalTokens: day.totalInputTokens + day.totalOutputTokens,
      totalCost: toMoneyString(day.totalCost)
    })).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
    recentUsage,
    revenueHistory: revenueHistory.map(row => ({
      effectiveMonth: new Date(row.effectiveMonth).toISOString().slice(0, 7),
      monthlyRevenueUsd: row.monthlyRevenueUsd
    }))
  };
}

export async function mergeCustomerInto(
  userId: string,
  sourceCustomerId: string,
  targetCustomerId: string
): Promise<CustomerMergeResult> {
  if (!sourceCustomerId || !targetCustomerId ||
      sourceCustomerId.length > 200 || targetCustomerId.length > 200) {
    throw new Error('Both customer IDs are required and must be 200 characters or fewer.');
  }
  if (sourceCustomerId === targetCustomerId) {
    throw new Error('Source and target customers must be different.');
  }

  return db.$transaction(async tx => {
    const customers = await tx.customer.findMany({ where: { userId } });
    const ownedIds = new Set(customers.map(customer => customer.customerId));
    if (!ownedIds.has(sourceCustomerId) || !ownedIds.has(targetCustomerId)) {
      throw new Error('Source or target customer was not found for this account.');
    }

    const counts = await tx.$queryRaw<{
      sourceRequests: number;
      targetRequests: number;
      conflicts: number;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM usage_records
          WHERE user_id = $1 AND customer_id = $2)::integer AS "sourceRequests",
         (SELECT COUNT(*) FROM usage_records
          WHERE user_id = $1 AND customer_id = $3)::integer AS "targetRequests",
         (SELECT COUNT(*) FROM revenue_versions AS source
          JOIN revenue_versions AS target
            ON target.user_id = source.user_id
           AND target.customer_id = $3
           AND target.effective_month = source.effective_month
          WHERE source.user_id = $1 AND source.customer_id = $2)::integer AS conflicts;`,
      userId,
      sourceCustomerId,
      targetCustomerId
    );
    const movedRequests = Number(counts[0]?.sourceRequests ?? 0);
    const targetRequests = Number(counts[0]?.targetRequests ?? 0);
    const revenueConflicts = Number(counts[0]?.conflicts ?? 0);

    await tx.$queryRaw(
      `UPDATE usage_records
       SET customer_id = $3, record_fingerprint = NULL
       WHERE user_id = $1 AND customer_id = $2
       RETURNING id;`,
      userId,
      sourceCustomerId,
      targetCustomerId
    );
    await tx.$queryRaw(
      `WITH ranked AS (
         SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, customer_id, timestamp, model_name, input_tokens, output_tokens
             ORDER BY id
           ) AS duplicate_rank
         FROM usage_records
         WHERE user_id = $1 AND customer_id = $2
       )
       DELETE FROM usage_records
       WHERE id IN (SELECT id FROM ranked WHERE duplicate_rank > 1)
       RETURNING id;`,
      userId,
      targetCustomerId
    );
    const copiedRows = await tx.$queryRaw<{ id: string }>(
      `INSERT INTO revenue_versions (
         id, user_id, customer_id, monthly_revenue_usd, effective_month
       )
       SELECT
         gen_random_uuid()::text,
         source.user_id,
         $3,
         source.monthly_revenue_usd,
         source.effective_month
       FROM revenue_versions AS source
       WHERE source.user_id = $1
         AND source.customer_id = $2
         AND NOT EXISTS (
           SELECT 1
           FROM revenue_versions AS target
           WHERE target.user_id = $1
             AND target.customer_id = $3
             AND target.effective_month = source.effective_month
         )
       ON CONFLICT (user_id, customer_id, effective_month) DO NOTHING
       RETURNING id;`,
      userId,
      sourceCustomerId,
      targetCustomerId
    );
    await tx.$queryRaw(
      'DELETE FROM revenue_versions WHERE user_id = $1 AND customer_id = $2 RETURNING id;',
      userId,
      sourceCustomerId
    );
    await tx.$queryRaw(
      'DELETE FROM customers WHERE user_id = $1 AND customer_id = $2 RETURNING id;',
      userId,
      sourceCustomerId
    );
    const remainingRows = await tx.$queryRaw<{ count: number }>(
      'SELECT COUNT(*)::integer AS count FROM usage_records WHERE user_id = $1 AND customer_id = $2;',
      userId,
      targetCustomerId
    );
    const duplicateRequestsRemoved = movedRequests + targetRequests - Number(remainingRows[0]?.count ?? 0);

    return {
      sourceCustomerId,
      targetCustomerId,
      movedRequests,
      duplicateRequestsRemoved,
      copiedRevenueVersions: copiedRows.length,
      revenueConflicts
    };
  });
}

export async function updateCustomerRevenue(
  userId: string,
  customerId: string,
  effectiveMonth: string,
  monthlyRevenueUsd: string | null
): Promise<void> {
  const rows = await db.$queryRaw<{ id: string }>(
    `INSERT INTO revenue_versions (
       id, user_id, customer_id, monthly_revenue_usd, effective_month
     )
     SELECT gen_random_uuid()::text, $1, customer.customer_id, $4::numeric, $3::date
     FROM customers AS customer
     WHERE customer.user_id = $1 AND customer.customer_id = $2
     ON CONFLICT (user_id, customer_id, effective_month)
     DO UPDATE SET monthly_revenue_usd = EXCLUDED.monthly_revenue_usd
     RETURNING id;`,
    userId,
    customerId,
    `${effectiveMonth}-01`,
    monthlyRevenueUsd
  );
  if (rows.length === 0) {
    throw new Error('Customer not found for this account.');
  }
}

export async function importCustomerRevenue(
  userId: string,
  rows: Array<{ customerId: string; monthlyRevenueUsd: string; effectiveMonth: string }>
): Promise<number> {
  const result = await db.$queryRaw<{ insertedCount: number; missingIds: string | null }>(
    `WITH incoming AS (
       SELECT *
       FROM jsonb_to_recordset($1::jsonb) AS row_data(
         "customerId" text,
         "monthlyRevenueUsd" numeric,
         "effectiveMonth" date
       )
     ),
     missing AS (
       SELECT DISTINCT incoming."customerId"
       FROM incoming
       WHERE NOT EXISTS (
         SELECT 1
         FROM customers AS customer
         WHERE customer.user_id = $2
           AND customer.customer_id = incoming."customerId"
       )
     ),
     inserted AS (
       INSERT INTO revenue_versions (
         id, user_id, customer_id, monthly_revenue_usd, effective_month
       )
       SELECT
         gen_random_uuid()::text,
         $2,
         incoming."customerId",
         incoming."monthlyRevenueUsd",
         incoming."effectiveMonth"
       FROM incoming
       WHERE NOT EXISTS (SELECT 1 FROM missing)
       ON CONFLICT (user_id, customer_id, effective_month)
       DO UPDATE SET monthly_revenue_usd = EXCLUDED.monthly_revenue_usd
       RETURNING id
     )
     SELECT
       (SELECT COUNT(*) FROM inserted)::integer AS "insertedCount",
       (SELECT string_agg("customerId", ', ' ORDER BY "customerId") FROM missing) AS "missingIds";`,
    JSON.stringify(rows.map(row => ({
      ...row,
      effectiveMonth: `${row.effectiveMonth}-01`
    }))),
    userId
  );
  const missingIds = result[0]?.missingIds;
  if (missingIds) {
    throw new Error(`Unknown customer IDs: ${missingIds}`);
  }
  if (Number(result[0]?.insertedCount) !== rows.length) {
    throw new Error('Some customer records changed while revenue was being imported. No revenue was changed.');
  }
  return rows.length;
}

export async function clearAllData(userId: string): Promise<void> {
  await db.$transaction(async tx => {
    await tx.$queryRaw(
      'DELETE FROM import_batches WHERE user_id = $1 RETURNING id;',
      userId
    );
    await tx.$queryRaw(
      'DELETE FROM revenue_versions WHERE user_id = $1 RETURNING id;',
      userId
    );
    await tx.$queryRaw(
      `DELETE FROM price_versions
       WHERE user_id = $1 AND user_id <> '__global__'
       RETURNING id;`,
      userId
    );
    await tx.usageRecord.deleteMany({ where: { userId } });
    await tx.customer.deleteMany({ where: { userId } });
  });
}
