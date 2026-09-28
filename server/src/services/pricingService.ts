import { db } from '../db.js';
import { DEFAULT_PRICING, ModelPricingItem } from '../config/defaultPricing.js';

let cachedPricing: Record<string, ModelPricingItem> | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function getActivePricing(): Promise<Record<string, ModelPricingItem>> {
  const now = Date.now();
  if (cachedPricing && now - lastCacheTime < CACHE_TTL) {
    return cachedPricing;
  }

  try {
    const dbPricing = await db.modelPricing.findMany();
    if (dbPricing && dbPricing.length > 0) {
      const map: Record<string, ModelPricingItem> = {};
      for (const item of dbPricing) {
        map[item.modelName.toLowerCase()] = {
          modelName: item.modelName,
          displayName: item.displayName,
          provider: item.provider,
          costPer1kInput: item.costPer1kInput,
          costPer1kOutput: item.costPer1kOutput
        };
      }
      cachedPricing = { ...DEFAULT_PRICING, ...map };
      lastCacheTime = now;
      return cachedPricing;
    }
  } catch (err) {
    // If DB is not yet seeded or unreachable, fall back gracefully to default pricing
    console.warn('Warning: Could not fetch pricing from DB, using default pricing map.', err instanceof Error ? err.message : err);
  }

  cachedPricing = DEFAULT_PRICING;
  lastCacheTime = now;
  return cachedPricing;
}

export function normalizeModelName(rawName: string, pricingKeys: string[]): string {
  if (!rawName) return 'default';
  const clean = rawName.trim().toLowerCase();

  if (pricingKeys.includes(clean)) {
    return clean;
  }

  // Sort keys by length descending to match 'gpt-4o' before 'gpt-4'
  const sorted = [...pricingKeys.filter(k => k !== 'default')].sort((a, b) => b.length - a.length);

  for (const key of sorted) {
    if (clean.startsWith(key)) {
      return key;
    }
    const simplifiedClean = clean.replace(/[-_.]/g, '');
    const simplifiedKey = key.replace(/[-_.]/g, '');
    if (simplifiedClean.startsWith(simplifiedKey)) {
      return key;
    }
  }

  return 'default';
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  modelPricing: ModelPricingItem
): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (inputTokens / 1000) * modelPricing.costPer1kInput;
  const outputCost = (outputTokens / 1000) * modelPricing.costPer1kOutput;
  const totalCost = Number((inputCost + outputCost).toFixed(6));

  return {
    inputCost: Number(inputCost.toFixed(6)),
    outputCost: Number(outputCost.toFixed(6)),
    totalCost
  };
}
