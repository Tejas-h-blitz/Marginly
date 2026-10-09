import React from 'react';
import { ImportSection } from '../ImportSection.js';
import { AlertNotification } from '../../types/index.js';

interface ImportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (file: File) => void;
  onPasteSubmit: (content: string, format: 'csv' | 'json') => void;
  onLoadSample: () => void;
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
  alert,
  onDismissAlert,
  loading
}) => {
  if (!isOpen) return null;

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
