import React, { useState, useMemo } from 'react';
import { ModelPricingItem } from '../types/index.js';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricing: Record<string, ModelPricingItem> | null;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  pricing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'all' | 'OpenAI' | 'Anthropic'>('all');

  const filteredModels = useMemo(() => {
    if (!pricing) return [];
    return Object.entries(pricing).filter(([key, info]) => {
      const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        info.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvider = selectedProvider === 'all' ||
        info.provider.toLowerCase() === selectedProvider.toLowerCase();
      return matchesSearch && matchesProvider;
    });
  }, [pricing, searchTerm, selectedProvider]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800/90 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
              Active LLM Pricing Catalog
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
              Unit prices in USD per 1,000 tokens; current rates are applied dynamically when costs are queried.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Provider Filter Toolbar */}
        <div className="px-4 sm:px-5 pt-3.5 pb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs w-fit">
            <button
              onClick={() => setSelectedProvider('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedProvider === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedProvider('OpenAI')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedProvider === 'OpenAI'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              OpenAI
            </button>
            <button
              onClick={() => setSelectedProvider('Anthropic')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedProvider === 'Anthropic'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Anthropic
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <svg
              className="w-3.5 h-3.5 stroke-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 fill-none stroke-2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search model name..."
              className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="p-4 sm:p-5 overflow-y-auto">
          <div className="overflow-x-auto rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/90 dark:border-zinc-800/90 text-[11px] uppercase tracking-wider font-medium">
                  <th className="py-2.5 px-3.5">Model</th>
                  <th className="py-2.5 px-3.5">Provider</th>
                  <th className="py-2.5 px-3.5 text-right font-mono">Input / 1k</th>
                  <th className="py-2.5 px-3.5 text-right font-mono">Output / 1k</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                      No models matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredModels.map(([key, info]) => (
                    <tr key={key} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-medium text-zinc-900 dark:text-white">
                        {key}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                          {info.provider}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono tabular-nums text-right text-zinc-700 dark:text-zinc-300">
                        ${info.costPer1kInput.toFixed(5)}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono tabular-nums text-right text-zinc-700 dark:text-zinc-300">
                        ${info.costPer1kOutput.toFixed(5)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-3 font-mono flex items-center justify-between">
            <span>Managed dynamically via PostgreSQL and active pricing catalog.</span>
            <span>{filteredModels.length} models listed</span>
          </p>
        </div>
      </div>
    </div>
  );
};
