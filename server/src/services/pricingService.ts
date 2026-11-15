import crypto from 'crypto';
import { db } from '../db.js';
import { DEFAULT_PRICING, ModelPricingItem } from '../config/defaultPricing.js';

const GLOBAL_USER_ID = '__global__';
const BASE_EFFECTIVE_FROM = new Date('1970-01-01T00:00:00.000Z');
const SCHEDULED_GLOBAL_CHANGES = [
  { modelName: 'gemini-3.8-flash', costPer1kInput: '0.0015', costPer1kOutput: '0.0075' },
  { modelName: 'gemini-3.6-flash', costPer1kInput: '0.0015', costPer1kOutput: '0.0075' }
] as const;

export interface PriceVersionResponse {
  id: string;
  modelName: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  effectiveFrom: string;
}

export interface PricingCatalogResponse {
  models: Record<string, ModelPricingItem>;
  upcoming: PriceVersionResponse[];
  custom: PriceVersionResponse[];
}

export interface UsageRateInput {
  modelName: string;
  timestamp: Date | null;
  inputTokens: number;
  outputTokens: number;
}

export interface UsageCost {
  ordinal: number;
  cost: string | null;
}

interface PricingRow {
  modelName: string;
  displayName: string;
  provider: string;
  costPer1kInput: string | null;
  costPer1kOutput: string | null;
}

interface VersionRow {
  id: string;
  modelName: string;
  costPer1kInput: string;
  costPer1kOutput: string;
  effectiveFrom: Date | string;
}

export class PriceVersionConflictError extends Error {}

export class PriceVersionInputError extends Error {}

function toVersionResponse(row: VersionRow): PriceVersionResponse {
  return {
    id: row.id,
    modelName: row.modelName,
    costPer1kInput: Number(row.costPer1kInput),
    costPer1kOutput: Number(row.costPer1kOutput),
    effectiveFrom: new Date(row.effectiveFrom).toISOString()
  };
}

function parseRatePerMillion(value: unknown): string {
  const text = typeof value === 'number' && Number.isFinite(value)
    ? String(value)
    : typeof value === 'string'
      ? value.trim()
      : '';
  if (!/^(?:0|[1-9]\d{0,12})(?:\.\d{1,7})?$/.test(text)) {
    throw new PriceVersionInputError('Rates must be non-negative amounts per one million tokens with up to 7 decimal places.');
  }
  const [whole, fraction = ''] = text.split('.');
  const scaled = BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, '0') || '0');
  const perThousandWhole = scaled / 10_000_000_000n;
  const perThousandFraction = (scaled % 10_000_000_000n).toString().padStart(10, '0');
  return `${perThousandWhole}.${perThousandFraction}`;
}

function parseEffectiveFrom(value: unknown): Date {
  if (value === undefined || value === null || value === '') {
    return BASE_EFFECTIVE_FROM;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new PriceVersionInputError('Effective from must be a valid YYYY-MM-DD date.');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new PriceVersionInputError('Effective from must be a valid YYYY-MM-DD date.');
  }
  return date;
}

async function parseCustomRate(input: {
  model_name?: unknown;
  input_per_million?: unknown;
  output_per_million?: unknown;
  effective_from?: unknown;
}): Promise<{
  modelName: string;
  costPer1kInput: string;
  costPer1kOutput: string;
  effectiveFrom: Date;
}> {
  if (typeof input.model_name !== 'string') {
    throw new PriceVersionInputError('Model name is required and must be 200 characters or fewer.');
  }
  const rawModelName = input.model_name.trim();
  if (!rawModelName || rawModelName.length > 200) {
    throw new PriceVersionInputError('Model name is required and must be 200 characters or fewer.');
  }
  const knownModels = await db.modelPricing.findMany();
  const modelName = normalizeModelIdentifier(rawModelName, [
    ...Object.keys(DEFAULT_PRICING),
    ...knownModels.map(model => model.modelName.toLowerCase())
  ]);
  if (!modelName || modelName.length > 200) {
    throw new PriceVersionInputError('Model name is invalid or too long.');
  }

  return {
    modelName,
    costPer1kInput: parseRatePerMillion(input.input_per_million),
    costPer1kOutput: parseRatePerMillion(input.output_per_million),
    effectiveFrom: parseEffectiveFrom(input.effective_from)
  };
}

export async function createCustomRate(
  userId: string,
  input: {
    model_name?: unknown;
    input_per_million?: unknown;
    output_per_million?: unknown;
    effective_from?: unknown;
  }
): Promise<PriceVersionResponse> {
  const rate = await parseCustomRate(input);
  const rows = await db.$queryRaw<VersionRow>(
    `INSERT INTO price_versions
      (id, user_id, model_name, cost_per_1k_input, cost_per_1k_output, effective_from)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, model_name, effective_from) DO NOTHING
     RETURNING
       id,
       model_name AS "modelName",
       cost_per_1k_input::text AS "costPer1kInput",
       cost_per_1k_output::text AS "costPer1kOutput",
       effective_from AS "effectiveFrom";`,
    crypto.randomUUID(),
    userId,
    rate.modelName,
    rate.costPer1kInput,
    rate.costPer1kOutput,
    rate.effectiveFrom
  );
  if (rows.length === 0) {
    throw new PriceVersionConflictError('A custom rate already exists for this model and effective date.');
  }
  return toVersionResponse(rows[0]);
}

export async function updateCustomRate(
  userId: string,
  id: string,
  input: {
    model_name?: unknown;
    input_per_million?: unknown;
    output_per_million?: unknown;
    effective_from?: unknown;
  }
): Promise<PriceVersionResponse | null> {
  if (!id || id.length > 200) {
    throw new PriceVersionInputError('Rate ID is required and must be 200 characters or fewer.');
  }
  const rate = await parseCustomRate(input);
  const owned = await db.$queryRaw<{ id: string }>(
    'SELECT id FROM price_versions WHERE id = $1 AND user_id = $2;',
    id,
    userId
  );
  if (owned.length === 0) return null;

  const duplicate = await db.$queryRaw<{ id: string }>(
    `SELECT id
     FROM price_versions
     WHERE user_id = $1
       AND model_name = $2
       AND effective_from = $3
       AND id <> $4
     LIMIT 1;`,
    userId,
    rate.modelName,
    rate.effectiveFrom,
    id
  );
  if (duplicate.length > 0) {
    throw new PriceVersionConflictError('A custom rate already exists for this model and effective date.');
  }

  const rows = await db.$queryRaw<VersionRow>(
    `UPDATE price_versions
     SET model_name = $3,
         cost_per_1k_input = $4,
         cost_per_1k_output = $5,
         effective_from = $6
     WHERE id = $1 AND user_id = $2
     RETURNING
       id,
       model_name AS "modelName",
       cost_per_1k_input::text AS "costPer1kInput",
       cost_per_1k_output::text AS "costPer1kOutput",
       effective_from AS "effectiveFrom";`,
    id,
    userId,
    rate.modelName,
    rate.costPer1kInput,
    rate.costPer1kOutput,
    rate.effectiveFrom
  );
  return rows.length > 0 ? toVersionResponse(rows[0]) : null;
}

export async function deleteCustomRate(userId: string, id: string): Promise<boolean> {
  if (!id || id.length > 200) {
    throw new PriceVersionInputError('Rate ID is required and must be 200 characters or fewer.');
  }
  const rows = await db.$queryRaw<{ id: string }>(
    'DELETE FROM price_versions WHERE id = $1 AND user_id = $2 RETURNING id;',
    id,
    userId
  );
  return rows.length > 0;
}

export async function ensurePricingSeeded(): Promise<string[]> {
  const defaultItems = Object.values(DEFAULT_PRICING);

  for (const item of defaultItems) {
    await db.modelPricing.upsert({
      where: { modelName: item.modelName },
      update: {
        displayName: item.displayName,
        provider: item.provider
      },
      create: {
        modelName: item.modelName,
        displayName: item.displayName,
        provider: item.provider
      }
    });

    await db.$queryRaw<{ id: string }>(
      `INSERT INTO price_versions
        (id, user_id, model_name, cost_per_1k_input, cost_per_1k_output, effective_from)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, model_name, effective_from) DO NOTHING
       RETURNING id;`,
      crypto.randomUUID(),
      GLOBAL_USER_ID,
      item.modelName.toLowerCase(),
      String(item.costPer1kInput),
      String(item.costPer1kOutput),
      BASE_EFFECTIVE_FROM
    );
  }

  const scheduledModels: string[] = [];
  for (const version of SCHEDULED_GLOBAL_CHANGES) {
    if (!DEFAULT_PRICING[version.modelName]) continue;

    await db.$queryRaw<{ id: string }>(
      `INSERT INTO price_versions
        (id, user_id, model_name, cost_per_1k_input, cost_per_1k_output, effective_from)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, model_name, effective_from) DO NOTHING
       RETURNING id;`,
      crypto.randomUUID(),
      GLOBAL_USER_ID,
      version.modelName,
      version.costPer1kInput,
      version.costPer1kOutput,
      new Date('2027-01-01T00:00:00.000Z')
    );
    scheduledModels.push(version.modelName);
  }

  return scheduledModels;
}

export async function getActivePricing(userId: string): Promise<PricingCatalogResponse> {
  const rows = await db.$queryRaw<PricingRow>(
    `SELECT
       model.model_name AS "modelName",
       model.display_name AS "displayName",
       model.provider AS "provider",
       current_rate.cost_per_1k_input::text AS "costPer1kInput",
       current_rate.cost_per_1k_output::text AS "costPer1kOutput"
     FROM model_pricing AS model
     LEFT JOIN LATERAL (
       SELECT version.cost_per_1k_input, version.cost_per_1k_output
       FROM price_versions AS version
       WHERE version.user_id IN ($1, $2)
         AND version.model_name = lower(trim(model.model_name))
         AND version.effective_from <= NOW()
       ORDER BY
         CASE WHEN version.user_id = $1 THEN 0 ELSE 1 END,
         version.effective_from DESC
       LIMIT 1
     ) AS current_rate ON TRUE
     ORDER BY model.model_name;`,
    userId,
    GLOBAL_USER_ID
  );

  const models: Record<string, ModelPricingItem> = {};
  for (const row of rows) {
    if (row.costPer1kInput === null || row.costPer1kOutput === null) continue;
    models[row.modelName.toLowerCase()] = {
      modelName: row.modelName,
      displayName: row.displayName,
      provider: row.provider,
      costPer1kInput: Number(row.costPer1kInput),
      costPer1kOutput: Number(row.costPer1kOutput)
    };
  }

  const upcomingRows = await db.$queryRaw<VersionRow>(
    `SELECT
       version.id,
       version.model_name AS "modelName",
       version.cost_per_1k_input::text AS "costPer1kInput",
       version.cost_per_1k_output::text AS "costPer1kOutput",
       version.effective_from AS "effectiveFrom"
     FROM price_versions AS version
     WHERE version.user_id = $1
       AND version.effective_from > NOW()
     ORDER BY version.effective_from, version.model_name;`,
    GLOBAL_USER_ID
  );

  const customRows = await db.$queryRaw<VersionRow>(
    `SELECT
       version.id,
       version.model_name AS "modelName",
       version.cost_per_1k_input::text AS "costPer1kInput",
       version.cost_per_1k_output::text AS "costPer1kOutput",
       version.effective_from AS "effectiveFrom"
     FROM price_versions AS version
     WHERE version.user_id = $1
     ORDER BY version.model_name, version.effective_from;`,
    userId
  );

  return {
    models: Object.keys(models).length > 0 ? models : DEFAULT_PRICING,
    upcoming: upcomingRows.map(toVersionResponse),
    custom: customRows.map(toVersionResponse)
  };
}

export async function getUsageCosts(userId: string, records: UsageRateInput[]): Promise<UsageCost[]> {
  if (records.length === 0) return [];

  const requestRows = records.map((record, ordinal) => ({
    ordinal,
    modelName: record.modelName,
    effectiveAt: record.timestamp?.toISOString() ?? null,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens
  }));
  const rows = await db.$queryRaw<UsageCost>(
    `WITH requests AS (
       SELECT *
       FROM jsonb_to_recordset($1::jsonb) AS request(
         ordinal integer,
         "modelName" text,
         "effectiveAt" timestamptz,
         "inputTokens" integer,
         "outputTokens" integer
       )
     )
     SELECT
       request.ordinal,
       CASE
         WHEN rate.user_id IS NULL THEN NULL
         ELSE (
           request."inputTokens"::numeric * rate.cost_per_1k_input
           + request."outputTokens"::numeric * rate.cost_per_1k_output
         ) / 1000
       END::text AS cost
     FROM requests AS request
     LEFT JOIN LATERAL (
       SELECT
         version.user_id,
         version.cost_per_1k_input,
         version.cost_per_1k_output
       FROM price_versions AS version
       WHERE version.model_name = request."modelName"
         AND version.user_id IN ($2, $3)
         AND version.effective_from <= COALESCE(request."effectiveAt", NOW())
       ORDER BY
         CASE WHEN version.user_id = $2 THEN 0 ELSE 1 END,
         version.effective_from DESC
       LIMIT 1
     ) AS rate ON TRUE
     ORDER BY request.ordinal;`,
    JSON.stringify(requestRows),
    userId,
    GLOBAL_USER_ID
  );
  return rows;
}

export function normalizeModelIdentifier(rawName: string, pricingKeys: string[] = []): string | null {
  if (!rawName.trim()) return null;
  let clean = rawName.trim().toLowerCase();

  clean = clean.replace(/^(models\/|google\/)/, '');
  if (clean.includes('/')) {
    const parts = clean.split('/');
    clean = parts[parts.length - 1];
  }

  if (pricingKeys.includes(clean)) return clean;

  const withoutLatest = clean.replace(/-latest$/, '');
  if (pricingKeys.includes(withoutLatest)) {
    clean = withoutLatest;
  }

  if (clean === 'gemini-3-flash' && pricingKeys.includes('gemini-3-flash-preview')) {
    return 'gemini-3-flash-preview';
  }
  if (clean === 'gemini-3.1-pro' && pricingKeys.includes('gemini-3.1-pro-preview')) {
    return 'gemini-3.1-pro-preview';
  }

  if (pricingKeys.includes(clean)) return clean;

  const versionedModel = clean.match(/^(.*)-(\d{8}|\d{4}-\d{2}-\d{2}|\d{3})$/);
  if (versionedModel && pricingKeys.includes(versionedModel[1])) {
    return versionedModel[1];
  }

  return clean;
}

export function normalizeModelName(rawName: string, pricingKeys: string[]): string | null {
  const normalized = normalizeModelIdentifier(rawName, pricingKeys);
  return normalized && pricingKeys.includes(normalized) ? normalized : null;
}
