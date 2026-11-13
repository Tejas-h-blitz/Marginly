import React, { useEffect, useRef, useState } from 'react';
import { ImportSection } from '../ImportSection.js';

interface ImportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (file: File) => Promise<boolean>;
  onPasteSubmit: (content: string, format: 'csv' | 'json') => Promise<boolean>;
  onLoadSample: () => void;
  onImportRevenue: (file: File) => Promise<boolean>;
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
  const [drawerError, setDrawerError] = useState<{ message: string; rejectedRows?: string[] } | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setDrawerError(null);
      return;
    }
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

  const handleUpload = async (file: File) => {
    setDrawerError(null);
    const success = await onUploadFile(file);
    if (success) onClose();
  };

  const handlePaste = async (content: string, format: 'csv' | 'json') => {
    setDrawerError(null);
    const success = await onPasteSubmit(content, format);
    if (success) onClose();
  };

  const handleRevenue = async (file: File) => {
    setDrawerError(null);
    const success = await onImportRevenue(file);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close import drawer"
        onClick={onClose}
        className="drawer-backdrop drawer-backdrop-button absolute inset-0 h-full w-full bg-black/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-drawer-title"
        className="drawer-panel relative z-10 flex h-full w-full max-w-xl flex-col bg-white dark:bg-[#121316] border-l border-zinc-200 dark:border-zinc-800/90 shadow-2xl overflow-hidden"
      >
        {/* Pinned Header */}
        <div className="drawer-reveal px-6 py-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-start justify-between gap-4 shrink-0 bg-white dark:bg-[#121316]">
          <div className="space-y-1">
            <h3 id="import-drawer-title" className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Upload Usage Logs
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
              Import token usage and revenue data to evaluate LLM spend and customer margins.
            </p>
          </div>

          <button
            ref={closeButton}
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="drawer-reveal flex-1 overflow-y-auto px-6 py-6 min-h-0 flex flex-col">
          <ImportSection
            onUploadFile={handleUpload}
            onPasteSubmit={handlePaste}
            onImportRevenue={handleRevenue}
            onLoadSample={() => {
              onLoadSample();
              onClose();
            }}
            onDownloadTemplate={downloadTemplate}
            loading={loading}
            externalError={drawerError}
          />
        </div>
      </div>
    </div>
  );
};
