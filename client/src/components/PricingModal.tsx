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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#141518] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Active LLM Pricing Catalog
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Unit prices in USD per 1,000 tokens applied during ingestion.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-md"
          >
            ×
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto">
          <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-zinc-800 text-[11px] uppercase tracking-wider font-medium">
                  <th className="py-2 px-3">Model</th>
                  <th className="py-2 px-3">Provider</th>
                  <th className="py-2 px-3 text-right">Input / 1k</th>
                  <th className="py-2 px-3 text-right">Output / 1k</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {pricing && Object.entries(pricing).map(([key, info]) => {
                  return (
                    <tr key={key} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="py-2 px-3 font-mono font-medium text-zinc-900 dark:text-zinc-100">{key}</td>
                      <td className="py-2 px-3 text-zinc-500 text-[11px]">{info.provider}</td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right text-zinc-700 dark:text-zinc-300">
                        ${info.costPer1kInput.toFixed(5)}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right text-zinc-700 dark:text-zinc-300">
                        ${info.costPer1kOutput.toFixed(5)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-3 font-mono">
            Pricing managed dynamically in PostgreSQL via Prisma.
          </p>
        </div>
      </div>
    </div>
  );
};
