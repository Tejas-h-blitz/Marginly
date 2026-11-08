import React, { useState, useRef } from 'react';
import { InlineSpinner } from './InlineSpinner.js';

interface ImportSectionProps {
  onUploadFile: (file: File) => void;
  onPasteSubmit: (content: string, format: 'csv' | 'json') => void;
  loading: boolean;
  externalError?: { message: string; rejectedRows?: string[] } | null;
}

export const ImportSection: React.FC<ImportSectionProps> = ({
  onUploadFile,
  onPasteSubmit,
  loading,
  externalError
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [pasteFormat, setPasteFormat] = useState<'csv' | 'json'>('csv');
  const [pasteContent, setPasteContent] = useState('');
  const [localError, setLocalError] = useState<{ message: string; rejectedRows?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeError = externalError || localError;

  const validateCsvText = (text: string): { valid: boolean; message?: string; rejectedRows?: string[] } => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return { valid: false, message: 'CSV file must contain a header row and at least one data row.' };
    }
    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim().replace(/['"]/g, ''));
    const customerIdx = headers.findIndex(h =>
      ['customer_id', 'customerid', 'customer', 'user_id', 'client_id'].includes(h.replace(/[-_]/g, ''))
    );
    if (customerIdx === -1) {
      return {
        valid: false,
        message: 'Missing required "customer_id" column header in the CSV file.',
        rejectedRows: [`Header row detected: "${lines[0]}"`]
      };
    }

    const rejected: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/['"]/g, ''));
      const customerVal = cols[customerIdx];
      if (!customerVal) {
        rejected.push(`Row ${i + 1}: missing customer_id`);
      }
    }

    if (rejected.length > 0) {
      return {
        valid: false,
        message: `${rejected.length} row${rejected.length === 1 ? '' : 's'} were rejected due to missing required fields.`,
        rejectedRows: rejected
      };
    }

    return { valid: true };
  };

  const validateJsonText = (text: string): { valid: boolean; message?: string; rejectedRows?: string[] } => {
    try {
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed)
        ? parsed
        : (parsed?.data || parsed?.records || parsed?.usage || parsed?.items);

      if (!Array.isArray(items) || items.length === 0) {
        return { valid: false, message: 'JSON data must contain an array of usage objects.' };
      }

      const rejected: string[] = [];
      items.forEach((item, idx) => {
        if (!item || typeof item !== 'object') {
          rejected.push(`Item ${idx + 1}: expected an object`);
        } else if (!item.customer_id && !item.customerId && !item.user_id && !item.client_id) {
          rejected.push(`Item ${idx + 1}: missing customer_id`);
        }
      });

      if (rejected.length > 0) {
        return {
          valid: false,
          message: `${rejected.length} item${rejected.length === 1 ? '' : 's'} were rejected due to missing customer_id.`,
          rejectedRows: rejected
        };
      }

      return { valid: true };
    } catch {
      return { valid: false, message: 'Invalid JSON syntax. Ensure quotes and brackets are properly matched.' };
    }
  };

  const handleProcessFile = (file: File) => {
    setLocalError(null);
    const filename = file.name.toLowerCase();
    const isJson = filename.endsWith('.json');
    const isCsv = filename.endsWith('.csv') || file.type.includes('csv');

    if (!isJson && !isCsv) {
      setLocalError({ message: 'Only CSV and JSON files are supported.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || !content.trim()) {
        setLocalError({ message: `File '${file.name}' is empty.` });
        return;
      }
      const validation = isJson ? validateJsonText(content) : validateCsvText(content);
      if (!validation.valid) {
        setLocalError({
          message: validation.message ?? 'File validation failed.',
          rejectedRows: validation.rejectedRows
        });
        return;
      }
      onUploadFile(file);
    };
    reader.onerror = () => {
      setLocalError({ message: `Could not read file '${file.name}'.` });
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (!loading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const insertTemplate = () => {
    setLocalError(null);
    if (pasteFormat === 'json') {
      setPasteContent(JSON.stringify([
        {
          customer_id: "cust_enterprise_alpha",
          timestamp: "2026-10-01T12:00:00Z",
          model_name: "gpt-4o",
          input_tokens: 25000,
          output_tokens: 12000
        },
        {
          customer_id: "cust_growth_beta",
          timestamp: "2026-10-01T12:15:00Z",
          model_name: "claude-3-5-sonnet",
          input_tokens: 40000,
          output_tokens: 18000
        },
        {
          customer_id: "cust_starter_gamma",
          timestamp: "2026-10-01T12:30:00Z",
          model_name: "gpt-4o-mini",
          input_tokens: 150000,
          output_tokens: 80000
        }
      ], null, 2));
    } else {
      setPasteContent([
        "customer_id,timestamp,model_name,input_tokens,output_tokens",
        "cust_enterprise_alpha,2026-10-01T12:00:00Z,gpt-4o,25000,12000",
        "cust_growth_beta,2026-10-01T12:15:00Z,claude-3-5-sonnet,40000,18000",
        "cust_starter_gamma,2026-10-01T12:30:00Z,gpt-4o-mini,150000,80000"
      ].join('\n'));
    }
  };

  const handlePasteProcess = () => {
    setLocalError(null);
    const trimmed = pasteContent.trim();
    if (!trimmed) {
      setLocalError({ message: 'Pasted content cannot be empty.' });
      return;
    }
    const validation = pasteFormat === 'json' ? validateJsonText(trimmed) : validateCsvText(trimmed);
    if (!validation.valid) {
      setLocalError({
        message: validation.message ?? 'Validation failed.',
        rejectedRows: validation.rejectedRows
      });
      return;
    }
    onPasteSubmit(trimmed, pasteFormat);
  };

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 text-xs w-full sm:w-fit shadow-xs">
        <button
          onClick={() => {
            setActiveTab('upload');
            setLocalError(null);
          }}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'upload'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-200/60 dark:border-zinc-700/60'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
          </svg>
          Upload CSV / JSON
        </button>
        <button
          onClick={() => {
            setActiveTab('paste');
            setLocalError(null);
          }}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'paste'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-200/60 dark:border-zinc-700/60'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Paste Raw Text
        </button>
      </div>

      {/* Readable Error Box with Rejected Rows (Requirement 7) */}
      {activeError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-900 dark:text-rose-200 shadow-xs space-y-2.5 animate-fadeIn"
        >
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-rose-950 dark:text-rose-100 text-xs">
                Import failed
              </div>
              <p className="mt-0.5 text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                {activeError.message}
              </p>
            </div>
          </div>

          {activeError.rejectedRows && activeError.rejectedRows.length > 0 && (
            <div className="pl-7 pt-1">
              <div className="text-xs font-semibold text-rose-950 dark:text-rose-100 mb-1.5">
                Rejected rows ({activeError.rejectedRows.length}):
              </div>
              <ul className="max-h-36 overflow-y-auto space-y-1 font-mono text-xs text-rose-800 dark:text-rose-200 bg-white/70 dark:bg-zinc-900/80 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                {activeError.rejectedRows.map((row, idx) => (
                  <li key={idx} className="truncate">• {row}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'upload' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!loading) setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false);
          }}
          onDrop={handleDrop}
          onClick={e => {
            if (!loading && e.target !== fileInputRef.current) fileInputRef.current?.click();
          }}
          onKeyDown={e => {
            if (!loading && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={loading ? -1 : 0}
          aria-disabled={loading}
          aria-label="Choose a usage CSV or JSON file, or drop it here"
          className={`dropzone group relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
            dragOver
              ? 'border-zinc-500 bg-zinc-100/90 dark:border-zinc-400 dark:bg-zinc-800/80 ring-2 ring-zinc-400/20'
              : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-[#18191d]/60 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100/50 dark:hover:bg-[#1c1d22]/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .json, text/csv, application/json"
            className="hidden"
            disabled={loading}
            onChange={handleFileChange}
          />
          <div className={`w-12 h-12 mx-auto mb-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/70 shadow-xs flex items-center justify-center text-zinc-700 dark:text-zinc-200 group-hover:scale-105 transition-transform ${dragOver ? '-translate-y-1' : ''}`}>
            <svg className="w-6 h-6 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white mb-1">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <InlineSpinner /> Importing file and computing spend...
              </span>
            ) : (
              'Click to upload or drag & drop CSV / JSON'
            )}
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-normal">
            OpenAI &amp; Anthropic API export format
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            <span className="font-medium mr-0.5">Required columns:</span>
            <code className="bg-white dark:bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/60 font-mono text-xs text-zinc-800 dark:text-zinc-200">customer_id</code>
            <code className="bg-white dark:bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/60 font-mono text-xs text-zinc-800 dark:text-zinc-200">model_name</code>
            <code className="bg-white dark:bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/60 font-mono text-xs text-zinc-800 dark:text-zinc-200">input_tokens</code>
            <code className="bg-white dark:bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/60 font-mono text-xs text-zinc-800 dark:text-zinc-200">output_tokens</code>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Format:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={pasteFormat === 'csv'}
                  onChange={() => {
                    setPasteFormat('csv');
                    setLocalError(null);
                  }}
                  className="accent-zinc-900 dark:accent-zinc-100"
                />
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">CSV</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={pasteFormat === 'json'}
                  onChange={() => {
                    setPasteFormat('json');
                    setLocalError(null);
                  }}
                  className="accent-zinc-900 dark:accent-zinc-100"
                />
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">JSON</span>
              </label>
            </div>

            <button
              type="button"
              onClick={insertTemplate}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Insert Sample Rows</span>
            </button>
          </div>

          <textarea
            value={pasteContent}
            onChange={(e) => {
              setPasteContent(e.target.value);
              if (localError) setLocalError(null);
            }}
            rows={7}
            className="w-full bg-zinc-50 dark:bg-[#141518] border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400/20 rounded-xl p-3.5 text-zinc-900 dark:text-zinc-100 font-mono text-xs leading-relaxed resize-y outline-none transition-colors"
            placeholder={`Paste raw ${pasteFormat.toUpperCase()} rows here...\nExample:\ncustomer_id,timestamp,model_name,input_tokens,output_tokens\ncust_alpha,2026-10-01T10:00:00Z,gpt-4o,25000,12000`}
          />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={loading || !pasteContent.trim()}
              onClick={handlePasteProcess}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium text-xs shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? <><InlineSpinner /> Processing...</> : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Process &amp; Calculate Costs</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
