import { DEFAULT_PRICING } from '../../../../server/src/config/defaultPricing.js';

export const LANDING_MODEL_CATALOG = Object.values(DEFAULT_PRICING);

export const LANDING_MODEL_GROUPS = Array.from(
  new Set(LANDING_MODEL_CATALOG.map(model => model.provider))
).map(provider => ({
  provider,
  models: LANDING_MODEL_CATALOG.filter(model => model.provider === provider)
}));
