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

      <div role="dialog" aria-modal="true" aria-labelledby="import-drawer-title" className="drawer-panel relative z-10 flex h-full w-full max-w-xl flex-col gap-5 overflow-y-auto border-l border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800/90 dark:bg-[#121316] sm:p-6">
        {/* Header */}
        <div className="drawer-reveal flex items-start justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
          <div>
            <h3 id="import-drawer-title" className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
              Upload Usage Logs
            </h3>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 mt-1">
              Upload your usage CSV, see which customers cost you the most in LLM tokens.
            </p>
          </div>

          <button
            ref={closeButton}
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Template & Schema Guidance Card */}
        <div className="drawer-reveal rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-[#18191d]/80 p-4 sm:p-5 text-xs space-y-4 shadow-xs">
          <div>
            <h4 className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              First import? Start with a CSV template
            </h4>
            
            <div className="mt-2.5 space-y-1.5">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Usage schema columns:
              </div>
              <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300">customer_id</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300">timestamp</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300">model_name</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300">input_tokens</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300">output_tokens</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadTemplate('marginly-usage-template.csv', 'customer_id,timestamp,model_name,input_tokens,output_tokens\ncustomer_001,2026-11-01T10:00:00Z,gpt-4o,1000,250\n')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 px-3 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-xs"
              >
                <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download usage template
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate('marginly-revenue-template.csv', 'customer_id,monthly_revenue_usd\ncustomer_001,499.00\n')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 px-3 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-xs"
              >
                <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download revenue template
              </button>
            </div>
          </div>

          <div className="border-t border-zinc-200/70 dark:border-zinc-800/80 pt-3.5 space-y-2.5">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Revenue schema columns:
              </div>
              <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300">customer_id</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300">monthly_revenue_usd</span>
              </div>
            </div>

            <div>
              <label
                aria-disabled={loading}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-800/90 border border-zinc-200/90 dark:border-zinc-700/80 px-3 py-1.5 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-xs ${loading ? 'pointer-events-none opacity-60' : ''}`}
              >
                <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span>
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
            </div>
          </div>

          {/* Privacy & Anonymization Callout - White Text and Professional Theme */}
          <div className="flex items-start gap-2.5 rounded-lg border border-zinc-300/80 dark:border-zinc-700/80 bg-zinc-900 dark:bg-zinc-800/90 px-3.5 py-2.5 shadow-xs">
            <svg className="w-4 h-4 shrink-0 text-zinc-300 dark:text-zinc-200 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-[11px] leading-relaxed text-white font-normal">
              Use anonymized customer IDs (not emails or names). You can delete all your data at any time with Clear.
            </p>
          </div>
        </div>

        {/* 10-Second Quick Sample Ingestion */}
        <div className="drawer-reveal flex items-center justify-between p-4 rounded-xl bg-zinc-50/80 dark:bg-[#18191d]/80 border border-zinc-200/90 dark:border-zinc-800/90 text-xs shadow-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Want to see it in action instantly?
            </div>
            <div className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Populates realistic multi-customer token data across 8 accounts.
            </div>
          </div>
          <button
            onClick={() => {
              onLoadSample();
              onClose();
            }}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium text-xs transition-all shrink-0 ml-3 shadow-xs disabled:opacity-50 flex items-center gap-1.5"
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
