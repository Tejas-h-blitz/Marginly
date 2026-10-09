import React, { useState, useRef } from 'react';
import { AlertNotification } from '../types/index.js';

interface ImportSectionProps {
  onUploadFile: (file: File) => void;
  onPasteSubmit: (content: string, format: 'csv' | 'json') => void;
  alert: AlertNotification | null;
  onDismissAlert: () => void;
  loading: boolean;
}

export const ImportSection: React.FC<ImportSectionProps> = ({
  onUploadFile,
  onPasteSubmit,
  alert,
  onDismissAlert,
  loading
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [pasteFormat, setPasteFormat] = useState<'csv' | 'json'>('csv');
  const [pasteContent, setPasteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFile(e.target.files[0]);
    }
  };

  const insertTemplate = () => {
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
    if (!pasteContent.trim()) return;
    onPasteSubmit(pasteContent, pasteFormat);
  };

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs w-fit">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-3 py-1 rounded-md font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Upload CSV / JSON
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`px-3 py-1 rounded-md font-medium transition-colors ${
            activeTab === 'paste'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Paste Raw Text
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800/40'
              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .json, text/csv, application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-9 h-9 mx-auto mb-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">
            Click to upload or drag & drop CSV file
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
            OpenAI & Anthropic API export format
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>Required columns:</span>
            <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">customer_id</code>
            <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">model_name</code>
            <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">input_tokens</code>
            <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">output_tokens</code>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <span className="text-zinc-500">Format:</span>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={pasteFormat === 'csv'}
                  onChange={() => setPasteFormat('csv')}
                  className="accent-zinc-900 dark:accent-zinc-100"
                />
                <span className="text-zinc-700 dark:text-zinc-300">CSV</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={pasteFormat === 'json'}
                  onChange={() => setPasteFormat('json')}
                  className="accent-zinc-900 dark:accent-zinc-100"
                />
                <span className="text-zinc-700 dark:text-zinc-300">JSON</span>
              </label>
            </div>

            <button
              type="button"
              onClick={insertTemplate}
              className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-2"
            >
              Insert Sample Rows
            </button>
          </div>

          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            rows={6}
            className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 rounded-lg p-3 text-zinc-900 dark:text-zinc-100 font-mono text-[11px] leading-relaxed resize-y outline-none"
            placeholder={`Paste raw ${pasteFormat.toUpperCase()} rows here...\nExample:\ncustomer_id,timestamp,model_name,input_tokens,output_tokens\ncust_alpha,2026-10-01T10:00:00Z,gpt-4o,25000,12000`}
          />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={loading || !pasteContent.trim()}
              onClick={handlePasteProcess}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium text-xs transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Process & Calculate Costs'}
            </button>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {alert && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between transition-colors ${
            alert.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200'
              : alert.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
              : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
          }`}
        >
          <span>{alert.message}</span>
          <button
            onClick={onDismissAlert}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ml-2"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
