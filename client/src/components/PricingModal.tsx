import React, { useEffect, useMemo, useState } from 'react';
import { ModelPricingItem, PriceVersionItem } from '../types/index.js';

interface CustomRateInput {
  model_name: string;
  input_per_million: string;
  output_per_million: string;
  effective_from: string;
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricing: Record<string, ModelPricingItem> | null;
  upcoming: PriceVersionItem[];
  customRates: PriceVersionItem[];
  initialModelName: string;
  onSaveCustomRate: (rate: CustomRateInput, id?: string) => Promise<boolean>;
  onDeleteCustomRate: (id: string) => Promise<boolean>;
}

const EMPTY_RATE: CustomRateInput = {
  model_name: '',
  input_per_million: '',
  output_per_million: '',
  effective_from: ''
};

function formatPerMillion(ratePer1k: number): string {
  return (ratePer1k * 1000).toFixed(7).replace(/\.?0+$/, '');
}

function formatEffectiveDate(value: string): string {
  return value.slice(0, 10) === '1970-01-01' ? 'Beginning' : value.slice(0, 10);
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  pricing,
  upcoming,
  customRates,
  initialModelName,
  onSaveCustomRate,
  onDeleteCustomRate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'all' | 'OpenAI' | 'Anthropic' | 'Google'>('all');
  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | undefined>();
  const [rateForm, setRateForm] = useState<CustomRateInput>(EMPTY_RATE);
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    if (!isOpen || !initialModelName) return;
    setRateForm({ ...EMPTY_RATE, model_name: initialModelName });
    setEditingRateId(undefined);
    setShowRateForm(true);
  }, [initialModelName, isOpen]);

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

  const beginNewRate = () => {
    setEditingRateId(undefined);
    setRateForm({ ...EMPTY_RATE, model_name: initialModelName });
    setShowRateForm(true);
  };

  const editRate = (rate: PriceVersionItem) => {
    setEditingRateId(rate.id);
    setRateForm({
      model_name: rate.modelName,
      input_per_million: formatPerMillion(rate.costPer1kInput),
      output_per_million: formatPerMillion(rate.costPer1kOutput),
      effective_from: rate.effectiveFrom.slice(0, 10) === '1970-01-01' ? '' : rate.effectiveFrom.slice(0, 10)
    });
    setShowRateForm(true);
  };

  const submitRate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingRate(true);
    try {
      if (await onSaveCustomRate(rateForm, editingRateId)) {
        setRateForm(EMPTY_RATE);
        setEditingRateId(undefined);
        setShowRateForm(false);
      }
    } finally {
      setSavingRate(false);
    }
  };

  const removeRate = async (rate: PriceVersionItem) => {
    if (!window.confirm(`Delete the custom rate for "${rate.modelName}" effective ${formatEffectiveDate(rate.effectiveFrom)}?`)) return;
    await onDeleteCustomRate(rate.id);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="bg-white dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800/90 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
              Active LLM Pricing Catalog
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
              Unit prices in USD per 1,000 tokens. Costs are recalculated from saved token counts using the effective rate for each usage timestamp; records without timestamps use current rates.
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

        <div className="px-4 sm:px-5 pt-3.5 pb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs w-fit">
            {(['all', 'OpenAI', 'Anthropic', 'Google'] as const).map(provider => (
              <button
                key={provider}
                onClick={() => setSelectedProvider(provider)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedProvider === provider
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {provider === 'all' ? 'All' : provider}
              </button>
            ))}
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
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search model name..."
              className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          <section>
            <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Shared model rates</h4>
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
                    filteredModels.map(([key, info]) => {
                      const nextRate = upcoming.find(rate => rate.modelName === key);
                      return (
                        <tr key={key} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-2.5 px-3.5 font-mono font-medium text-zinc-900 dark:text-white">
                            <span>{key}</span>
                            {nextRate && (
                              <span className="block mt-1 font-sans text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                                Upcoming change · {nextRate.effectiveFrom.slice(0, 10)}
                              </span>
                            )}
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Your custom rates</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Private to your account · enter rates per 1M tokens</p>
              </div>
              <button
                type="button"
                onClick={beginNewRate}
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Add custom rate
              </button>
            </div>

            {customRates.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                No custom rates yet.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {customRates.map(rate => (
                  <li key={rate.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <code className="block truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">{rate.modelName}</code>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        From {formatEffectiveDate(rate.effectiveFrom)} · ${rate.costPer1kInput.toFixed(5)} in / ${rate.costPer1kOutput.toFixed(5)} out per 1k
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => editRate(rate)}
                        className="rounded-md px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeRate(rate)}
                        className="rounded-md px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {showRateForm && (
              <form onSubmit={submitRate} className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {editingRateId ? 'Edit custom rate' : 'Add custom rate'}
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRateForm(false);
                      setEditingRateId(undefined);
                      setRateForm(EMPTY_RATE);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Cancel
                  </button>
                </div>
                <label className="block space-y-1">
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">Model name</span>
                  <input
                    required
                    maxLength={200}
                    value={rateForm.model_name}
                    onChange={event => setRateForm(current => ({ ...current, model_name: event.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400">Input price / 1M USD</span>
                    <input
                      required
                      min="0"
                      step="any"
                      type="number"
                      value={rateForm.input_per_million}
                      onChange={event => setRateForm(current => ({ ...current, input_per_million: event.target.value }))}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400">Output price / 1M USD</span>
                    <input
                      required
                      min="0"
                      step="any"
                      type="number"
                      value={rateForm.output_per_million}
                      onChange={event => setRateForm(current => ({ ...current, output_per_million: event.target.value }))}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </label>
                </div>
                <label className="block space-y-1">
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">Effective from (UTC, optional)</span>
                  <input
                    type="date"
                    value={rateForm.effective_from}
                    onChange={event => setRateForm(current => ({ ...current, effective_from: event.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                  <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">Leave empty to apply from the beginning.</span>
                </label>
                <button
                  type="submit"
                  disabled={savingRate}
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                >
                  {savingRate ? 'Saving…' : editingRateId ? 'Save changes' : 'Save rate'}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
