import React, { useEffect, useRef } from 'react';
import { ImportSection } from '../ImportSection.js';
import { InlineSpinner } from '../InlineSpinner.js';

interface ImportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (file: File) => void;
  onPasteSubmit: (content: string, format: 'csv' | 'json') => void;
  onLoadSample: () => void;
  onImportRevenue: (file: File) => void;
  loading: boolean;
}

export const ImportDrawer: React.FC<ImportDrawerProps> = ({
  isOpen,
  onClose,
  onUploadFile,
  onPasteSubmit,
  onLoadSample,
  onImportRevenue,
  loading
}) => {
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    previousFocus.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key === 'Tab') {
        const dialog = closeButton.current?.closest('[role="dialog"]');
        const focusable = dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus.current?.focus();
      previousFocus.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const downloadTemplate = (name: string, contents: string) => {
    const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close import drawer"
        onClick={onClose}
        className="drawer-backdrop drawer-backdrop-button absolute inset-0 h-full w-full bg-black/55 backdrop-blur-sm"
      />

      <div role="dialog" aria-modal="true" aria-labelledby="import-drawer-title" className="drawer-panel relative z-10 flex h-full w-full max-w-xl flex-col gap-4 overflow-y-auto border-l border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-[#141518] sm:p-6">
        {/* Header */}
        <div className="drawer-reveal flex items-start justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
          <div>
            <h3 id="import-drawer-title" className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Upload Usage Logs
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Upload your usage CSV, see which customers cost you the most.
            </p>
          </div>

          <button
            ref={closeButton}
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="drawer-reveal space-y-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-3 text-xs">
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
          <label
            aria-disabled={loading}
            className={`inline-flex cursor-pointer items-center rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 ${loading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <span className="inline-flex items-center gap-1.5">
              {loading && <InlineSpinner />}
              {loading ? 'Importing revenue...' : 'Import revenue CSV'}
            </span>
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
        <div className="drawer-reveal flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs">
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
            {loading ? <><InlineSpinner /> Loading...</> : 'Load Sample CSV'}
          </button>
        </div>

        {/* Ingestion Dropzone & Paste Component */}
        <div className="drawer-reveal">
          <ImportSection
            onUploadFile={(file) => {
              onUploadFile(file);
              onClose();
            }}
            onPasteSubmit={(content, format) => {
              onPasteSubmit(content, format);
              onClose();
            }}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
