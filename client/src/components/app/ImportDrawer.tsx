import React from 'react';
import { ImportSection } from '../ImportSection.js';
import { AlertNotification } from '../../types/index.js';

interface ImportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (file: File) => void;
  onPasteSubmit: (content: string, format: 'csv' | 'json') => void;
  onLoadSample: () => void;
  onImportRevenue: (file: File) => void;
  alert: AlertNotification | null;
  onDismissAlert: () => void;
  loading: boolean;
}

export const ImportDrawer: React.FC<ImportDrawerProps> = ({
  isOpen,
  onClose,
  onUploadFile,
  onPasteSubmit,
  onLoadSample,
  onImportRevenue,
  alert,
  onDismissAlert,
  loading
}) => {
  if (!isOpen) return null;

  const downloadTemplate = (name: string, contents: string) => {
    const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#141518] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 sm:p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Upload Usage Logs
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Upload your usage CSV, see which customers cost you the most.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-3 text-xs">
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">First import? Start with a CSV template</h4>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              Usage columns: <code>customer_id,timestamp,model_name,input_tokens,output_tokens</code>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadTemplate('marginly-usage-template.csv', 'customer_id,timestamp,model_name,input_tokens,output_tokens\ncustomer_001,2026-11-01T10:00:00Z,gpt-4o,1000,250\n')}
                className="rounded-md border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
              >
                Download usage template
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate('marginly-revenue-template.csv', 'customer_id,monthly_revenue_usd\ncustomer_001,499.00\n')}
                className="rounded-md border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
              >
                Download revenue template
              </button>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Revenue columns: <code>customer_id,monthly_revenue_usd</code>
          </p>
          <label className="inline-flex cursor-pointer items-center rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700">
            Import revenue CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={loading}
              onChange={event => {
                const file = event.target.files?.[0];
                if (file) onImportRevenue(file);
                event.currentTarget.value = '';
              }}
            />
          </label>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            Use anonymized customer IDs (not emails or names). You can delete all your data at any time with Clear.
          </p>
        </div>

        {/* 10-Second Quick Sample Ingestion */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs">
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              Want to see it in action instantly?
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Populates realistic multi-customer token data across 8 accounts.
            </div>
          </div>
          <button
            onClick={() => {
              onLoadSample();
              onClose();
            }}
            disabled={loading}
            className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium text-xs transition-all shrink-0 ml-3 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Sample CSV'}
          </button>
        </div>

        {/* Ingestion Dropzone & Paste Component */}
        <ImportSection
          onUploadFile={(file) => {
            onUploadFile(file);
            onClose();
          }}
          onPasteSubmit={(content, format) => {
            onPasteSubmit(content, format);
            onClose();
          }}
          alert={alert}
          onDismissAlert={onDismissAlert}
          loading={loading}
        />
      </div>
    </div>
  );
};
