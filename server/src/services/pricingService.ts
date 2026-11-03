import { db } from '../db.js';
import { DEFAULT_PRICING, ModelPricingItem } from '../config/defaultPricing.js';

export async function getActivePricing(): Promise<Record<string, ModelPricingItem>> {
  const dbPricing = await db.modelPricing.findMany();
  if (dbPricing.length === 0) {
    return DEFAULT_PRICING;
  }

  return Object.fromEntries(dbPricing.map(item => [
    item.modelName.toLowerCase(),
    {
      modelName: item.modelName,
      displayName: item.displayName,
      provider: item.provider,
      costPer1kInput: item.costPer1kInput,
      costPer1kOutput: item.costPer1kOutput
    }
  ]));
}

export function normalizeModelName(rawName: string, pricingKeys: string[]): string | null {
  if (!rawName.trim()) return null;
  let clean = rawName.trim().toLowerCase();

  // Strip resource and provider prefixes (e.g., "models/gemini-2.5-flash" -> "gemini-2.5-flash")
  clean = clean.replace(/^(models\/|google\/)/, '');
  if (clean.includes('/')) {
    const parts = clean.split('/');
    clean = parts[parts.length - 1];
  }

  if (pricingKeys.includes(clean)) {
    return clean;
  }

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

  return null;
}

// Note: Rates in USD per 1,000 tokens (text input/output; output INCLUDES thinking tokens).
// Text rates only. Audio, image, and video rates differ and are out of scope.
// TODO: gemini-3.8-flash and gemini-3.6-flash rates double on 2027-01-01 (input 0.0015, output 0.0075 per 1k).
// TODO: gemini-3.1-pro-preview and gemini-2.5-pro use higher rates for prompts over 200k tokens. Ignore for now.
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  modelPricing: ModelPricingItem
): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (inputTokens / 1000) * modelPricing.costPer1kInput;
  const outputCost = (outputTokens / 1000) * modelPricing.costPer1kOutput;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost
  };
}
