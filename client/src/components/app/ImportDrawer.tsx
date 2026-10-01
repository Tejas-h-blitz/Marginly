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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 sm:p-7 backdrop-blur-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Ingest LLM Usage Logs</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Drop your OpenAI or Anthropic CSV exports, paste raw JSON logs, or load sample records.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Sample Button */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-xs text-emerald-300">
            <strong>Fast Demo:</strong> Want to test with realistic mock customer records immediately?
          </div>
          <button
            onClick={() => {
              onLoadSample();
              onClose();
            }}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all shrink-0"
          >
            {loading ? 'Loading...' : 'Load Demo Data'}
          </button>
        </div>

        {/* Existing Ingestion Component */}
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
