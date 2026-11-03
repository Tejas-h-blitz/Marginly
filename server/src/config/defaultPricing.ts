export interface ModelPricingItem {
  modelName: string;
  displayName: string;
  provider: string;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export const DEFAULT_PRICING: Record<string, ModelPricingItem> = {
  'gpt-4o': {
    modelName: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'OpenAI',
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.0100
  },
  'gpt-4o-mini': {
    modelName: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'OpenAI',
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006
  },
  'gpt-4-turbo': {
    modelName: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    provider: 'OpenAI',
    costPer1kInput: 0.0100,
    costPer1kOutput: 0.0300
  },
  'gpt-4': {
    modelName: 'gpt-4',
    displayName: 'GPT-4',
    provider: 'OpenAI',
    costPer1kInput: 0.0300,
    costPer1kOutput: 0.0600
  },
  'gpt-3.5-turbo': {
    modelName: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.0015
  },
  'o1': {
    modelName: 'o1',
    displayName: 'OpenAI o1',
    provider: 'OpenAI',
    costPer1kInput: 0.0150,
    costPer1kOutput: 0.0600
  },
  'o1-mini': {
    modelName: 'o1-mini',
    displayName: 'OpenAI o1-mini',
    provider: 'OpenAI',
    costPer1kInput: 0.0030,
    costPer1kOutput: 0.0120
  },
  'o3-mini': {
    modelName: 'o3-mini',
    displayName: 'OpenAI o3-mini',
    provider: 'OpenAI',
    costPer1kInput: 0.0011,
    costPer1kOutput: 0.0044
  },
  'claude-3-7-sonnet': {
    modelName: 'claude-3-7-sonnet',
    displayName: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    costPer1kInput: 0.0030,
    costPer1kOutput: 0.0150
  },
  'claude-3-5-sonnet': {
    modelName: 'claude-3-5-sonnet',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    costPer1kInput: 0.0030,
    costPer1kOutput: 0.0150
  },
  'claude-sonnet-4': {
    modelName: 'claude-sonnet-4',
    displayName: 'Claude Sonnet 4',
    provider: 'Anthropic',
    costPer1kInput: 0.0030,
    costPer1kOutput: 0.0150
  },
  'claude-3-5-haiku': {
    modelName: 'claude-3-5-haiku',
    displayName: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    costPer1kInput: 0.0008,
    costPer1kOutput: 0.0040
  },
  'claude-3-haiku': {
    modelName: 'claude-3-haiku',
    displayName: 'Claude 3 Haiku',
    provider: 'Anthropic',
    costPer1kInput: 0.00025,
    costPer1kOutput: 0.00125
  },
  'claude-3-opus': {
    modelName: 'claude-3-opus',
    displayName: 'Claude 3 Opus',
    provider: 'Anthropic',
    costPer1kInput: 0.0150,
    costPer1kOutput: 0.0750
  },
  // Google Gemini Models
  // Source: ai.google.dev/gemini-api/docs/pricing (page updated 2026-10-09).
  // Note: Rates in USD per 1,000 tokens (text input/output; output INCLUDES thinking tokens).
  // Text rates only. Audio, image, and video rates differ and are out of scope.
  'gemini-3.8-flash': {
    // TODO: gemini-3.8-flash rates double on 2027-01-01 (input 0.0015, output 0.0075 per 1k).
    modelName: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash',
    provider: 'Google',
    costPer1kInput: 0.00075,
    costPer1kOutput: 0.00375
  },
  'gemini-3.6-flash': {
    // TODO: gemini-3.6-flash rates double on 2027-01-01 (input 0.0015, output 0.0075 per 1k).
    modelName: 'gemini-3.6-flash',
    displayName: 'Gemini 3.6 Flash',
    provider: 'Google',
    costPer1kInput: 0.00075,
    costPer1kOutput: 0.00375
  },
  'gemini-3.5-flash-lite': {
    modelName: 'gemini-3.5-flash-lite',
    displayName: 'Gemini 3.5 Flash-Lite',
    provider: 'Google',
    costPer1kInput: 0.0003,
    costPer1kOutput: 0.0025
  },
  'gemini-3.1-flash-lite': {
    modelName: 'gemini-3.1-flash-lite',
    displayName: 'Gemini 3.1 Flash-Lite',
    provider: 'Google',
    costPer1kInput: 0.00025,
    costPer1kOutput: 0.0015
  },
  'gemini-3-flash-preview': {
    modelName: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash Preview',
    provider: 'Google',
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.003
  },
  'gemini-3.1-pro-preview': {
    // TODO: gemini-3.1-pro-preview uses higher rates for prompts over 200k tokens. Ignore for now.
    modelName: 'gemini-3.1-pro-preview',
    displayName: 'Gemini 3.1 Pro Preview',
    provider: 'Google',
    costPer1kInput: 0.002,
    costPer1kOutput: 0.012
  },
  'gemini-2.5-pro': {
    // TODO: gemini-2.5-pro uses higher rates for prompts over 200k tokens. Ignore for now.
    modelName: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'Google',
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.01
  },
  'gemini-2.5-flash': {
    modelName: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    provider: 'Google',
    costPer1kInput: 0.0003,
    costPer1kOutput: 0.0025
  },
  'gemini-2.5-flash-lite': {
    modelName: 'gemini-2.5-flash-lite',
    displayName: 'Gemini 2.5 Flash-Lite',
    provider: 'Google',
    costPer1kInput: 0.0001,
    costPer1kOutput: 0.0004
  }
};
