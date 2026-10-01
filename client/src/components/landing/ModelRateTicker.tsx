import React, { useState } from 'react';

interface ModelInfo {
  name: string;
  provider: 'OpenAI' | 'Anthropic';
  inputPrice: string;
  outputPrice: string;
  contextWindow: string;
  highlight?: boolean;
}

const MODELS: ModelInfo[] = [
  { name: 'GPT-4o', provider: 'OpenAI', inputPrice: '$0.00250', outputPrice: '$0.01000', contextWindow: '128k', highlight: true },
  { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', inputPrice: '$0.00300', outputPrice: '$0.01500', contextWindow: '200k', highlight: true },
  { name: 'GPT-4o-mini', provider: 'OpenAI', inputPrice: '$0.00015', outputPrice: '$0.00060', contextWindow: '128k' },
  { name: 'Claude 3 Haiku', provider: 'Anthropic', inputPrice: '$0.00025', outputPrice: '$0.00125', contextWindow: '200k' },
  { name: 'o1-preview', provider: 'OpenAI', inputPrice: '$0.01500', outputPrice: '$0.06000', contextWindow: '128k' },
  { name: 'Claude 3 Opus', provider: 'Anthropic', inputPrice: '$0.01500', outputPrice: '$0.07500', contextWindow: '200k' },
  { name: 'GPT-4-turbo', provider: 'OpenAI', inputPrice: '$0.01000', outputPrice: '$0.03000', contextWindow: '128k' },
  { name: 'o1-mini', provider: 'OpenAI', inputPrice: '$0.00300', outputPrice: '$0.01200', contextWindow: '128k' },
];

export const ModelRateTicker: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'OpenAI' | 'Anthropic'>('All');

  const filtered = MODELS.filter((m) =>
    activeFilter === 'All' ? true : m.provider === activeFilter
  );

  return (
    <section id="models" className="py-20 relative bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Live Rate Cards
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Supported LLM Pricing Rates
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl">
              Normalized pricing matrix automatically accounts for input prompts and output generation token pricing.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/10 self-start md:self-auto">
            {(['All', 'OpenAI', 'Anthropic'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === filter
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((model) => (
            <div
              key={model.name}
              className={`p-5 rounded-2xl border transition-all duration-300 ${
                model.highlight
                  ? 'bg-slate-900/80 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/50 border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-white text-sm">{model.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    model.provider === 'OpenAI'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}
                >
                  {model.provider}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono pt-1">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 font-sans">Input / 1k:</span>
                  <span className="text-white font-bold">{model.inputPrice}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 font-sans">Output / 1k:</span>
                  <span className="text-emerald-400 font-bold">{model.outputPrice}</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-2 border-t border-white/5 text-[11px]">
                  <span className="text-slate-400 font-sans">Context:</span>
                  <span className="text-slate-400">{model.contextWindow}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
