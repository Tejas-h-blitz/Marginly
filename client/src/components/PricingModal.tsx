import React from 'react';
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
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-dark-card border border-dark-border rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Active LLM Model Pricing</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <p className="text-xs text-slate-400 mb-4">
            Stored in PostgreSQL <code>model_pricing</code> table and managed via Prisma. Rates are calculated in USD per 1,000 tokens.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-dark-secondary text-slate-400 border-b border-dark-border">
                  <th className="py-2.5 px-3">Model Key</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Input / 1k</th>
                  <th className="py-2.5 px-3">Output / 1k</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pricing && Object.entries(pricing).map(([key, info]) => {
                  const prov = (info.provider || 'Other').toLowerCase();
                  let tagClass = 'bg-indigo-500/15 text-indigo-300';
                  if (prov.includes('openai')) tagClass = 'bg-emerald-500/15 text-emerald-300';
                  if (prov.includes('anthropic')) tagClass = 'bg-amber-500/15 text-amber-300';

                  return (
                    <tr key={key} className="hover:bg-dark-cardHover">
                      <td className="py-2 px-3 font-mono font-bold text-slate-200">{key}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${tagClass}`}>
                          {info.provider}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-300">${info.costPer1kInput.toFixed(5)}</td>
                      <td className="py-2 px-3 font-mono text-slate-300">${info.costPer1kOutput.toFixed(5)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-500 mt-4">
            To customize model rates, update the <code>model_pricing</code> table via Prisma or modify <code>prisma/seed.ts</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
