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
  'default': {
    modelName: 'default',
    displayName: 'Generic Model',
    provider: 'Other',
    costPer1kInput: 0.0020,
    costPer1kOutput: 0.0060
  }
};
