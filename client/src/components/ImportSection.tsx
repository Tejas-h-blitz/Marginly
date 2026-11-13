import React, { useState, useRef } from 'react';
import { InlineSpinner } from './InlineSpinner.js';

interface ImportSectionProps {
  onUploadFile: (file: File) => void;
  onPasteSubmit: (content: string, format: 'csv' | 'json') => void;
  onImportRevenue?: (file: File) => void;
  onLoadSample?: () => void;
  onDownloadTemplate?: (name: string, contents: string) => void;
  loading: boolean;
  externalError?: { message: string; rejectedRows?: string[] } | null;
}

export const ImportSection: React.FC<ImportSectionProps> = ({
  onUploadFile,
  onPasteSubmit,
  onImportRevenue,
  onLoadSample,
  onDownloadTemplate,
  loading,
  externalError
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'revenue'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [revenueDragOver, setRevenueDragOver] = useState(false);
  const [pasteFormat, setPasteFormat] = useState<'csv' | 'json'>('csv');
  const [pasteContent, setPasteContent] = useState('');
  const [localError, setLocalError] = useState<{ message: string; rejectedRows?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const revenueFileInputRef = useRef<HTMLInputElement>(null);

  const activeError = externalError || localError;

  const downloadTemplate = (name: string, contents: string) => {
    if (onDownloadTemplate) {
      onDownloadTemplate(name, contents);
      return;
    }
    const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

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

  const validateRevenueCsvText = (text: string): { valid: boolean; message?: string; rejectedRows?: string[] } => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return { valid: false, message: 'Revenue CSV must contain a header row and at least one data row.' };
    }
    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim().replace(/['"]/g, ''));
    const customerIdx = headers.findIndex(h =>
      ['customer_id', 'customerid', 'customer', 'user_id', 'client_id'].includes(h.replace(/[-_]/g, ''))
    );
    const revenueIdx = headers.findIndex(h =>
      ['monthly_revenue_usd', 'revenue', 'revenue_usd', 'monthly_revenue', 'amount'].includes(h.replace(/[-_]/g, ''))
    );
    if (customerIdx === -1 || revenueIdx === -1) {
      return {
        valid: false,
        message: 'Revenue CSV must include "customer_id" and "monthly_revenue_usd" columns.',
        rejectedRows: [`Header row detected: "${lines[0]}"`]
      };
    }
    const rejected: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/['"]/g, ''));
      const customerVal = cols[customerIdx];
      const revenueVal = cols[revenueIdx];
      if (!customerVal || !revenueVal || isNaN(Number(revenueVal.replace(/[$,]/g, '')))) {
        rejected.push(`Row ${i + 1}: invalid or missing customer/revenue (${lines[i]})`);
      }
    }
    if (rejected.length > 0) {
      return {
        valid: false,
        message: `${rejected.length} row${rejected.length === 1 ? '' : 's'} were rejected due to invalid fields.`,
        rejectedRows: rejected
      };
    }
    return { valid: true };
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

  const handleProcessRevenueFile = (file: File) => {
    setLocalError(null);
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.csv') && !file.type.includes('csv')) {
      setLocalError({ message: 'Only CSV files are supported for revenue import.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || !content.trim()) {
        setLocalError({ message: `File '${file.name}' is empty.` });
        return;
      }
      const validation = validateRevenueCsvText(content);
      if (!validation.valid) {
        setLocalError({
          message: validation.message ?? 'Revenue CSV validation failed.',
          rejectedRows: validation.rejectedRows
        });
        return;
      }
      if (onImportRevenue) {
        onImportRevenue(file);
      }
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

  const handleRevenueDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setRevenueDragOver(false);
    if (!loading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessRevenueFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleRevenueFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessRevenueFile(e.target.files[0]);
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
    <div className="flex-1 flex flex-col space-y-5 min-h-full">
      {/* Sleek Segmented Switcher with Micro-Icons */}
      <div className="p-1 rounded-xl bg-zinc-100/90 dark:bg-[#15171c] border border-zinc-200/90 dark:border-zinc-800/80 grid grid-cols-3 gap-1 text-xs font-medium shrink-0">
        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            setLocalError(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all text-center whitespace-nowrap ${
            activeTab === 'upload'
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs border border-zinc-200/60 dark:border-zinc-700/60 font-semibold'
              : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <span>Upload File</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('paste');
            setLocalError(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all text-center whitespace-nowrap ${
            activeTab === 'paste'
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs border border-zinc-200/60 dark:border-zinc-700/60 font-semibold'
              : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Paste Text</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('revenue');
            setLocalError(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-all text-center whitespace-nowrap ${
            activeTab === 'revenue'
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs border border-zinc-200/60 dark:border-zinc-700/60 font-semibold'
              : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Revenue CSV</span>
        </button>
      </div>

      {/* Readable Error Box with Rejected Rows */}
      {activeError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-900 dark:text-rose-200 shadow-xs space-y-2.5 animate-fadeIn shrink-0"
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
                Import rejected
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

      {/* Tab 1: Upload File */}
      {activeTab === 'upload' && (
        <div className="flex-1 flex flex-col justify-between space-y-4 min-h-0">
          <div className="space-y-4">
            {/* Proportional, Compact Dropzone */}
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
              aria-label="Upload usage CSV or JSON file"
              className={`dropzone group relative border-2 border-dashed rounded-xl py-7 px-6 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 flex flex-col items-center justify-center min-h-[170px] ${
                dragOver
                  ? 'border-zinc-500 bg-zinc-100/90 dark:border-zinc-500 dark:bg-zinc-800/60 ring-2 ring-zinc-400/20'
                  : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#14161a]/60 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-100/60 dark:hover:bg-[#181a21]'
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

              <div className="w-10 h-10 mb-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/70 shadow-xs flex items-center justify-center text-zinc-700 dark:text-zinc-200 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </div>

              <div className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 mb-1">
                {loading ? (
                  <span className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <InlineSpinner /> Ingesting file and computing costs...
                  </span>
                ) : (
                  <>
                    <span>Drop your usage file here, or </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">browse files</span>
                  </>
                )}
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-normal">
                Supports CSV &amp; JSON exports from OpenAI, Anthropic, Gemini, or custom gateways (up to 50MB)
              </p>

              <div className="flex items-center gap-2 mt-2.5">
                <span className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/90 text-[10px] font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  .CSV
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/90 text-[10px] font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  .JSON
                </span>
              </div>
            </div>

            {/* Expected Schema Specification Card */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Expected Usage Schema</span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadTemplate('marginly-usage-template.csv', 'customer_id,timestamp,model_name,input_tokens,output_tokens\ncustomer_001,2026-11-01T10:00:00Z,gpt-4o,1000,250\ncustomer_002,2026-11-01T10:15:00Z,claude-3-5-sonnet,4000,800\n')}
                  className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download template</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/60">
                  <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                    <span>customer_id</span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-sans">req</span>
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">Account or user identifier</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/60">
                  <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                    <span>model_name</span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-sans">req</span>
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">e.g. gpt-4o, claude-3-5-sonnet</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/60">
                  <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                    <span>tokens (in / out)</span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-sans">req</span>
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">input_tokens &amp; output_tokens</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/60">
                  <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                    <span>timestamp</span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-sans">opt</span>
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">ISO 8601 UTC date string</div>
                </div>
              </div>
            </div>

            {/* Privacy & Ingestion Callout */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-600 dark:text-zinc-400">
              <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="leading-relaxed text-[11px]">
                <strong className="font-medium text-zinc-900 dark:text-zinc-200">Tenant-isolated parsing: </strong>
                Only token counts and customer identifiers are ingested to compute unit economics. Prompt contents and completions are never uploaded or retained.
              </p>
            </div>
          </div>

          {/* Discreet Sample Data Action - Anchored to Bottom */}
          {onLoadSample && (
            <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1 shrink-0">
              <span>Want to test instantly? Populates sample logs across 8 accounts.</span>
              <button
                type="button"
                onClick={onLoadSample}
                disabled={loading}
                className="interaction-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium text-xs shadow-xs transition-colors shrink-0 disabled:opacity-50 whitespace-nowrap ml-3"
              >
                {loading ? <><InlineSpinner /> Loading...</> : 'Load Sample Data'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Paste Raw Text */}
      {activeTab === 'paste' && (
        <div className="flex-1 flex flex-col justify-between space-y-4 min-h-0">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">Format:</span>
                <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setPasteFormat('csv');
                      setLocalError(null);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      pasteFormat === 'csv'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs font-semibold'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasteFormat('json');
                      setLocalError(null);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      pasteFormat === 'json'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs font-semibold'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={insertTemplate}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Insert sample rows</span>
              </button>
            </div>

            <textarea
              value={pasteContent}
              onChange={(e) => {
                setPasteContent(e.target.value);
                if (localError) setLocalError(null);
              }}
              rows={8}
              className="w-full min-h-[190px] sm:min-h-[210px] bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400/20 rounded-xl p-3.5 text-zinc-900 dark:text-zinc-100 font-mono text-xs leading-relaxed resize-y outline-none transition-colors"
              placeholder={`Paste raw ${pasteFormat.toUpperCase()} rows here...\nExample:\ncustomer_id,timestamp,model_name,input_tokens,output_tokens\ncust_alpha,2026-10-01T10:00:00Z,gpt-4o,25000,12000`}
            />

            {/* Minimal Schema & Submit Bar */}
            <div className="space-y-2 pt-1 text-xs text-zinc-500 dark:text-zinc-400 px-1">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Expected columns:</span>
                <button
                  type="button"
                  disabled={loading || !pasteContent.trim()}
                  onClick={handlePasteProcess}
                  className="interaction-button inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium text-xs shadow-xs transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {loading ? <><InlineSpinner /> Ingesting...</> : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Ingest Records</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <code className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">customer_id</code>
                <code className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">model_name</code>
                <code className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">input_tokens</code>
                <code className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">output_tokens</code>
              </div>
            </div>

            {/* Ingestion tip */}
            <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-600 dark:text-zinc-400">
              <p className="leading-relaxed text-[11px]">
                <strong className="font-medium text-zinc-900 dark:text-zinc-200">Catalog matching: </strong>
                Model names (e.g. <code className="font-mono text-[10px] px-1 py-0.5 bg-zinc-200/60 dark:bg-zinc-800 rounded">gpt-4o</code>, <code className="font-mono text-[10px] px-1 py-0.5 bg-zinc-200/60 dark:bg-zinc-800 rounded">claude-3-5-sonnet</code>) are automatically mapped to official API rates.
              </p>
            </div>
          </div>

          {/* Bottom Anchored Demo Action */}
          {onLoadSample && (
            <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1 shrink-0">
              <span>Don't have logs handy? Explore with preloaded demo data.</span>
              <button
                type="button"
                onClick={onLoadSample}
                disabled={loading}
                className="interaction-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium text-xs shadow-xs transition-colors shrink-0 disabled:opacity-50 whitespace-nowrap ml-3"
              >
                {loading ? <><InlineSpinner /> Loading...</> : 'Load Sample Data'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Customer Revenue */}
      {activeTab === 'revenue' && (
        <div className="flex-1 flex flex-col justify-between space-y-4 min-h-0">
          <div className="space-y-4">
            {/* Proportional Revenue Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!loading) setRevenueDragOver(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setRevenueDragOver(false);
              }}
              onDrop={handleRevenueDrop}
              onClick={e => {
                if (!loading && e.target !== revenueFileInputRef.current) revenueFileInputRef.current?.click();
              }}
              onKeyDown={e => {
                if (!loading && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  revenueFileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={loading ? -1 : 0}
              aria-disabled={loading}
              aria-label="Choose a customer revenue CSV file, or drop it here"
              className={`dropzone group relative border-2 border-dashed rounded-xl py-7 px-6 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 flex flex-col items-center justify-center min-h-[170px] ${
                revenueDragOver
                  ? 'border-zinc-500 bg-zinc-100/90 dark:border-zinc-500 dark:bg-zinc-800/60 ring-2 ring-zinc-400/20'
                  : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#14161a]/60 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-100/60 dark:hover:bg-[#181a21]'
              }`}
            >
              <input
                ref={revenueFileInputRef}
                type="file"
                accept=".csv, text/csv"
                className="hidden"
                disabled={loading}
                onChange={handleRevenueFileChange}
              />

              <div className="w-10 h-10 mb-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/70 shadow-xs flex items-center justify-center text-zinc-700 dark:text-zinc-200 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 mb-1">
                {loading ? (
                  <span className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <InlineSpinner /> Ingesting customer revenue...
                  </span>
                ) : (
                  <>
                    <span>Drop your revenue CSV here, or </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">browse files</span>
                  </>
                )}
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-normal">
                Assigns monthly contract or subscription revenue across customer accounts
              </p>

              <div className="flex items-center gap-2 mt-2.5">
                <span className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/90 text-[10px] font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  .CSV
                </span>
              </div>
            </div>

            {/* Expected Revenue Schema Specification Card */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Expected Revenue Schema</span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadTemplate('marginly-revenue-template.csv', 'customer_id,monthly_revenue_usd\ncustomer_001,499.00\ncustomer_002,299.00\n')}
                  className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download template</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/60">
                  <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                    <span>customer_id</span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-sans">req</span>
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">Matches usage log identifier</div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/60">
                  <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                    <span>monthly_revenue_usd</span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-sans">req</span>
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">Recurring contract value in USD</div>
                </div>
              </div>
            </div>

            {/* Why Revenue Matters Callout */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-600 dark:text-zinc-400">
              <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="leading-relaxed text-[11px]">
                <strong className="font-medium text-zinc-900 dark:text-zinc-200">Unit economics calculation: </strong>
                Comparing monthly contract revenue against LLM spend calculates blended gross margins and pinpoints accounts where AI costs exceed subscription fees.
              </p>
            </div>
          </div>

          {/* Bottom Table Inline Edit Hint */}
          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1 shrink-0">
            <span>You can also edit revenue per customer directly on the dashboard table.</span>
            {onLoadSample && (
              <button
                type="button"
                onClick={onLoadSample}
                disabled={loading}
                className="interaction-button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium text-xs shadow-xs transition-colors shrink-0 disabled:opacity-50 whitespace-nowrap ml-3"
              >
                {loading ? <><InlineSpinner /> Loading...</> : 'Load Sample Data'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
