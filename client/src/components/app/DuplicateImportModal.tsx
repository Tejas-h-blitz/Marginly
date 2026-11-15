import React from 'react';
import { DuplicateImportPreview } from '../../types/index.js';

interface DuplicateImportModalProps {
  preview: DuplicateImportPreview | null;
  loading: boolean;
  onChoose: (mode: 'skip' | 'allow') => void;
  onCancel: () => void;
}

export const DuplicateImportModal: React.FC<DuplicateImportModalProps> = ({
  preview,
  loading,
  onChoose,
  onCancel
}) => {
  if (!preview) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-import-title"
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-[#121316]"
      >
        <h2 id="duplicate-import-title" className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          Duplicate usage rows found
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          No records have been imported yet. This file has {preview.totalDuplicates} duplicate row{preview.totalDuplicates === 1 ? '' : 's'}:
          {' '}{preview.existing} already in your account and {preview.withinFile} repeated within this file.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onChoose('skip')}
            disabled={loading}
            className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Skip duplicates
          </button>
          <button
            type="button"
            onClick={() => onChoose('allow')}
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
          >
            Import all rows
          </button>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="mt-3 w-full rounded-lg px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        {loading && <p role="status" className="mt-3 text-center text-xs text-zinc-500">Importing…</p>}
      </section>
    </div>
  );
};
