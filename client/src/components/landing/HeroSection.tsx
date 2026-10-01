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
    claude_sonnet: 0.009, // $3.00 input / $15.00 output blend
    gpt4o_mini: 0.000375 // $0.15 input / $0.60 output blend
  };

  const calculatedCost = Number(((tokenUsageK * rates[modelType])).toFixed(2));
  const profit = Number((subPrice - calculatedCost).toFixed(2));
  const marginPercent = subPrice > 0 ? Math.round((profit / subPrice) * 100) : 0;
  const isNegative = marginPercent < 0;

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Ambient Glow Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/15 via-brand-indigo/20 to-teal-500/10 blur-[130px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] -z-10 pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Announcement Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Unit Economics &amp; Gross Margin Protection</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Stop Losing Gross Margins to{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Heavy LLM Users
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Marginly monitors per-customer token consumption across OpenAI &amp; Anthropic in real-time. Identify negative-margin accounts eating into your cash flow and protect your SaaS margins before the next invoice.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onLaunchApp}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold px-7 py-3.5 rounded-2xl text-sm shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                <span>Launch Interactive Demo</span>
                <svg className="w-4 h-4 stroke-slate-950 fill-none stroke-2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <button
                onClick={onOpenAuth}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 border border-white/10 hover:border-white/20 font-semibold px-6 py-3.5 rounded-2xl text-sm backdrop-blur-md transition-all"
              >
                <span>Create Free Account</span>
              </button>
            </div>

            {/* Trust Points */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>OpenAI &amp; Anthropic Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Zero Prompt Storage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>PostgreSQL &amp; Prisma Backend</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live Margin Simulator Widget */}
          <div className="lg:col-span-5">
            <div className="relative p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-1">Margin Simulator</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                  Live Preview
                </span>
              </div>

              {/* Interactive Controls */}
              <div className="space-y-4 pt-5">
                {/* Plan Price */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                    <span>Customer Subscription Plan</span>
                    <span className="font-mono text-emerald-400 font-bold">${subPrice} / mo</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="199"
                    step="5"
                    value={subPrice}
                    onChange={(e) => setSubPrice(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                {/* Model Selector */}
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1.5">Active LLM Model</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setModelType('gpt4o')}
                      className={`text-[11px] py-1.5 rounded-lg border font-medium transition-all ${
                        modelType === 'gpt4o'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      GPT-4o
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelType('claude_sonnet')}
                      className={`text-[11px] py-1.5 rounded-lg border font-medium transition-all ${
                        modelType === 'claude_sonnet'
                          ? 'bg-brand-indigo/30 border-brand-indigo/60 text-indigo-300'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      Claude 3.5
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelType('gpt4o_mini')}
                      className={`text-[11px] py-1.5 rounded-lg border font-medium transition-all ${
                        modelType === 'gpt4o_mini'
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      GPT-4o mini
                    </button>
                  </div>
                </div>

                {/* Monthly Tokens */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                    <span>Monthly Tokens Consumed</span>
                    <span className="font-mono text-cyan-400 font-bold">{(tokenUsageK / 1000).toFixed(1)}M Tokens</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="15000"
                    step="200"
                    value={tokenUsageK}
                    onChange={(e) => setTokenUsageK(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Result Card */}
                <div
                  className={`mt-4 p-4 rounded-2xl border transition-all ${
                    isNegative
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                      : marginPercent > 60
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                      Margin Health
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        isNegative
                          ? 'bg-rose-500/20 text-rose-300'
                          : marginPercent > 60
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {isNegative ? '⚠️ Negative Margin!' : `${marginPercent}% Gross Margin`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-400 text-[11px]">Calculated Token Cost:</div>
                      <div className="font-mono font-bold text-white text-sm">${calculatedCost}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px]">Net Profit / User:</div>
                      <div className={`font-mono font-bold text-sm ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {profit >= 0 ? `+$${profit}` : `-$${Math.abs(profit)}`}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLaunchApp}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Track All Accounts on Dashboard</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
