import React, { useState } from 'react';

interface ModelInfo {
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google';
  inputPrice: string;
  outputPrice: string;
  contextWindow: string;
  highlight?: boolean;
}

const MODELS: ModelInfo[] = [
  // Google Gemini Models
  // Source: ai.google.dev/gemini-api/docs/pricing (page updated 2026-10-09).
  // Note: Rates in USD per 1,000 tokens (text input/output; output INCLUDES thinking tokens).
  // Text rates only. Audio, image, and video rates differ and are out of scope.
  // TODO: gemini-3.8-flash rates double on 2027-01-01 (input 0.0015, output 0.0075 per 1k).
  { name: 'Gemini 3.8 Flash', provider: 'Google', inputPrice: '$0.00075', outputPrice: '$0.00375', contextWindow: '1M' },
  // TODO: gemini-3.6-flash rates double on 2027-01-01 (input 0.0015, output 0.0075 per 1k).
  { name: 'Gemini 3.6 Flash', provider: 'Google', inputPrice: '$0.00075', outputPrice: '$0.00375', contextWindow: '1M' },
  { name: 'Gemini 3.5 Flash-Lite', provider: 'Google', inputPrice: '$0.00030', outputPrice: '$0.00250', contextWindow: '1M' },
  { name: 'Gemini 3.1 Flash-Lite', provider: 'Google', inputPrice: '$0.00025', outputPrice: '$0.00150', contextWindow: '1M' },
  { name: 'Gemini 3 Flash Preview', provider: 'Google', inputPrice: '$0.00050', outputPrice: '$0.00300', contextWindow: '1M' },
  // TODO: gemini-3.1-pro-preview uses higher rates for prompts over 200k tokens. Ignore for now.
  { name: 'Gemini 3.1 Pro Preview', provider: 'Google', inputPrice: '$0.00200', outputPrice: '$0.01200', contextWindow: '2M' },
  // TODO: gemini-2.5-pro uses higher rates for prompts over 200k tokens. Ignore for now.
  { name: 'Gemini 2.5 Pro', provider: 'Google', inputPrice: '$0.00125', outputPrice: '$0.01000', contextWindow: '2M', highlight: true },
  { name: 'Gemini 2.5 Flash', provider: 'Google', inputPrice: '$0.00030', outputPrice: '$0.00250', contextWindow: '1M', highlight: true },
  { name: 'Gemini 2.5 Flash-Lite', provider: 'Google', inputPrice: '$0.00010', outputPrice: '$0.00040', contextWindow: '1M' },

  // OpenAI Models
  { name: 'GPT-4o', provider: 'OpenAI', inputPrice: '$0.00250', outputPrice: '$0.01000', contextWindow: '128k', highlight: true },
  { name: 'GPT-4o-mini', provider: 'OpenAI', inputPrice: '$0.00015', outputPrice: '$0.00060', contextWindow: '128k' },
  { name: 'o1', provider: 'OpenAI', inputPrice: '$0.01500', outputPrice: '$0.06000', contextWindow: '128k' },
  { name: 'o1-mini', provider: 'OpenAI', inputPrice: '$0.00300', outputPrice: '$0.01200', contextWindow: '128k' },
  { name: 'o3-mini', provider: 'OpenAI', inputPrice: '$0.00110', outputPrice: '$0.00440', contextWindow: '128k' },
  { name: 'GPT-4-turbo', provider: 'OpenAI', inputPrice: '$0.01000', outputPrice: '$0.03000', contextWindow: '128k' },

  // Anthropic Models
  { name: 'Claude 3.7 Sonnet', provider: 'Anthropic', inputPrice: '$0.00300', outputPrice: '$0.01500', contextWindow: '200k' },
  { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', inputPrice: '$0.00300', outputPrice: '$0.01500', contextWindow: '200k', highlight: true },
  { name: 'Claude 3.5 Haiku', provider: 'Anthropic', inputPrice: '$0.00080', outputPrice: '$0.00400', contextWindow: '200k' },
  { name: 'Claude 3 Haiku', provider: 'Anthropic', inputPrice: '$0.00025', outputPrice: '$0.00125', contextWindow: '200k' },
  { name: 'Claude 3 Opus', provider: 'Anthropic', inputPrice: '$0.01500', outputPrice: '$0.07500', contextWindow: '200k' }
];

export const ModelRateTicker: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'OpenAI' | 'Anthropic' | 'Google'>('All');

  const filtered = MODELS.filter((m) =>
    activeFilter === 'All' ? true : m.provider === activeFilter
  );

  return (
    <section id="models" className="py-20 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#0e0f12]/50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300/60 dark:border-zinc-700/60 mb-2.5">
              Live Rate Cards
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Supported LLM Model Pricing Matrix
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
              Unit prices in USD per 1,000 tokens applied during customer ingestion. Input and output generation tokens tracked with distinct rates.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-300/60 dark:border-zinc-800 self-start md:self-auto">
            {(['All', 'Google', 'OpenAI', 'Anthropic'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((model) => (
            <div
              key={model.name}
              className={`p-4 rounded-xl border transition-all ${
                model.highlight
                  ? 'bg-white dark:bg-[#141518] border-zinc-300 dark:border-zinc-700 shadow-xs'
                  : 'bg-white/70 dark:bg-[#121316] border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-mono font-medium text-xs text-zinc-900 dark:text-zinc-100">{model.name}</span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    model.provider === 'Google'
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                      : model.provider === 'OpenAI'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {model.provider}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono pt-1">
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                  <span className="text-[11px] font-sans text-zinc-500">Input / 1k</span>
                  <span className="tabular-nums text-zinc-800 dark:text-zinc-200 font-medium">{model.inputPrice}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                  <span className="text-[11px] font-sans text-zinc-500">Output / 1k</span>
                  <span className="tabular-nums text-zinc-800 dark:text-zinc-200 font-medium">{model.outputPrice}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px]">
                  <span className="font-sans text-zinc-400 dark:text-zinc-500">Context Window</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono">{model.contextWindow}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
