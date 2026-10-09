import React, { useState } from 'react';

interface HeroSectionProps {
  onLaunchApp: () => void;
  onOpenAuth: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLaunchApp, onOpenAuth }) => {
  // Interactive mini calculator states
  const [subPrice, setSubPrice] = useState(49);
  const [tokenUsageK, setTokenUsageK] = useState(2500); // 2.5M tokens
  const [modelType, setModelType] = useState<'gpt4o' | 'claude_sonnet' | 'gpt4o_mini'>('gpt4o');

  // Pricing per 1k tokens (blend)
  const rates: Record<string, number> = {
    gpt4o: 0.00625, // $2.50 input / $10.00 output blend per 1k
    claude_sonnet: 0.009, // $3.00 input / $15.00 output blend per 1k
    gpt4o_mini: 0.000375 // $0.15 input / $0.60 output blend per 1k
  };

  const calculatedCost = Number((tokenUsageK * rates[modelType]).toFixed(2));
  const profit = Number((subPrice - calculatedCost).toFixed(2));
  const marginPercent = subPrice > 0 ? Math.round((profit / subPrice) * 100) : 0;
  const isNegative = marginPercent < 0;

  return (
    <section className="pt-28 pb-16 sm:pt-36 sm:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Clear Value Proposition */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-xs font-mono text-zinc-700 dark:text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>LLM Unit Economics For SaaS Founders</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 leading-[1.15]">
              See which customers cost you the most in LLM tokens.
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Marginly maps raw OpenAI and Anthropic API logs to customer accounts, calculating per-customer unit economics and margin risk in seconds.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onLaunchApp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium px-5 py-2.5 rounded-lg text-xs shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <span>Launch Live Demo</span>
                <span className="font-mono text-[10px]">→</span>
              </button>

              <button
                onClick={onOpenAuth}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-medium px-4 py-2.5 rounded-lg text-xs transition-colors"
              >
                <span>Create Free Account</span>
              </button>
            </div>

            {/* Direct Feature List */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
              <span>• OpenAI & Anthropic</span>
              <span>• CSV Ingestion</span>
              <span>• Export Reports</span>
            </div>
          </div>

          {/* Right Column: Interactive Margin Simulator Widget */}
          <div className="lg:col-span-5">
            <div className="rounded-xl bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 shadow-sm p-5 space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Interactive Margin Simulator
                </span>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  Live Preview
                </span>
              </div>

              {/* Controls */}
              <div className="space-y-3.5 text-xs">
                {/* Subscription Fee */}
                <div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400 mb-1">
                    <span>Customer Plan Price</span>
                    <span className="font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                      ${subPrice} / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="199"
                    step="5"
                    value={subPrice}
                    aria-label="Customer Plan Price Slider"
                    onChange={(e) => setSubPrice(Number(e.target.value))}
                    className="w-full accent-zinc-900 dark:accent-zinc-100 cursor-pointer h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg"
                  />
                </div>

                {/* Monthly Tokens */}
                <div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400 mb-1">
                    <span>Account Usage Volume</span>
                    <span className="font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                      {(tokenUsageK / 1000).toFixed(1)}M tokens / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="250"
                    value={tokenUsageK}
                    aria-label="Account Usage Volume Slider"
                    onChange={(e) => setTokenUsageK(Number(e.target.value))}
                    className="w-full accent-zinc-900 dark:accent-zinc-100 cursor-pointer h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg"
                  />
                </div>

                {/* Model Selector */}
                <div>
                  <div className="text-zinc-600 dark:text-zinc-400 mb-1.5">Model Used</div>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => setModelType('gpt4o')}
                      className={`py-1 px-1.5 rounded-md border text-center transition-colors ${
                        modelType === 'gpt4o'
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 font-medium'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                      }`}
                    >
                      GPT-4o
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelType('claude_sonnet')}
                      className={`py-1 px-1.5 rounded-md border text-center transition-colors ${
                        modelType === 'claude_sonnet'
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 font-medium'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                      }`}
                    >
                      Claude 3.5
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelType('gpt4o_mini')}
                      className={`py-1 px-1.5 rounded-md border text-center transition-colors ${
                        modelType === 'gpt4o_mini'
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 font-medium'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                      }`}
                    >
                      4o-mini
                    </button>
                  </div>
                </div>
              </div>

              {/* Result Summary Box */}
              <div className={`p-3.5 rounded-lg border transition-colors ${
                isNegative
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50'
                  : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800'
              }`}>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Revenue</div>
                    <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">
                      ${subPrice}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">LLM Cost</div>
                    <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">
                      ${calculatedCost}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Gross Margin</div>
                    <div className={`text-sm font-bold tabular-nums mt-0.5 ${
                      isNegative ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {marginPercent}%
                    </div>
                  </div>
                </div>

                {isNegative ? (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-2.5 pt-2 border-t border-amber-200 dark:border-amber-800/40 text-center font-medium">
                    ⚠️ Negative Margin: You lose ${Math.abs(profit).toFixed(2)}/mo on this account.
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-center">
                    Healthy Unit Economics: Net gross profit of ${profit.toFixed(2)}/mo.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
