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
          timestamp: "2026-09-22T12:00:00Z",
          model_name: "gpt-4o",
          input_tokens: 15000,
          output_tokens: 3200
        },
        {
          customer_id: "cust_growth_beta",
          timestamp: "2026-09-22T12:05:00Z",
          model_name: "claude-3-5-sonnet",
          input_tokens: 28000,
          output_tokens: 4900
        },
        {
          customer_id: "cust_starter_gamma",
          timestamp: "2026-09-22T12:10:00Z",
          model_name: "gpt-4o-mini",
          input_tokens: 3500,
          output_tokens: 800
        }
      ], null, 2));
    } else {
      setPasteContent([
        "customer_id,timestamp,model_name,input_tokens,output_tokens",
        "cust_enterprise_alpha,2026-09-22T12:00:00Z,gpt-4o,15000,3200",
        "cust_growth_beta,2026-09-22T12:05:00Z,claude-3-5-sonnet,28000,4900",
        "cust_starter_gamma,2026-09-22T12:10:00Z,gpt-4o-mini,3500,800"
      ].join('\n'));
    }
  };

  const handlePasteProcess = () => {
    if (!pasteContent.trim()) return;
    onPasteSubmit(pasteContent, pasteFormat);
  };

  return (
    <section className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-7 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 stroke-brand-indigo fill-none stroke-2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Usage Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Import CSV or JSON logs containing customer_id, timestamp, model_name, input_tokens, output_tokens
          </p>
        </div>

        <div className="flex bg-dark-secondary p-1 rounded-lg border border-dark-border gap-1">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-brand-indigo text-white shadow-md shadow-brand-indigo/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-brand-indigo text-white shadow-md shadow-brand-indigo/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Paste Raw Data
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-brand-indigo bg-brand-indigo/5'
              : 'border-slate-700/60 bg-dark-secondary/50 hover:border-brand-indigo/60 hover:bg-brand-indigo/[0.02]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .json, text/csv, application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-12 h-12 mx-auto mb-3 bg-brand-indigo/15 rounded-full flex items-center justify-center text-indigo-400">
            <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-white mb-1">
            Click or drag & drop usage file here
          </div>
          <div className="text-xs text-slate-400 mb-3">
            Supports .csv or .json files
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <span>Required headers:</span>
            <code className="bg-dark-surface px-1.5 py-0.5 rounded text-slate-200 font-mono">customer_id</code>
            <code className="bg-dark-surface px-1.5 py-0.5 rounded text-slate-200 font-mono">timestamp</code>
            <code className="bg-dark-surface px-1.5 py-0.5 rounded text-slate-200 font-mono">model_name</code>
            <code className="bg-dark-surface px-1.5 py-0.5 rounded text-slate-200 font-mono">input_tokens</code>
            <code className="bg-dark-surface px-1.5 py-0.5 rounded text-slate-200 font-mono">output_tokens</code>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="font-semibold text-slate-400">Format:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={pasteFormat === 'csv'}
                  onChange={() => setPasteFormat('csv')}
                  className="accent-brand-indigo"
                />
                CSV
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={pasteFormat === 'json'}
                  onChange={() => setPasteFormat('json')}
                  className="accent-brand-indigo"
                />
                JSON
              </label>
            </div>

            <button
              type="button"
              onClick={insertTemplate}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-dark-surface hover:bg-slate-700/80 border border-dark-border text-slate-200 transition-all cursor-pointer"
            >
              Insert Sample Rows
            </button>
          </div>

          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            rows={5}
            className="w-full bg-[#090d16] border border-dark-border focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo rounded-lg p-3 text-slate-200 font-mono text-xs leading-relaxed resize-y outline-none"
            placeholder={`Paste your ${pasteFormat.toUpperCase()} rows here...\nExample:\ncustomer_id,timestamp,model_name,input_tokens,output_tokens\ncust_alpha,2026-09-22T10:00:00Z,gpt-4o,12500,2400`}
          />

          <div className="flex justify-end">
            <button
              type="button"
              disabled={loading || !pasteContent.trim()}
              onClick={handlePasteProcess}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-brand-indigo hover:bg-indigo-500 text-white shadow-md shadow-brand-indigo/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Process & Calculate Costs
            </button>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {alert && (
        <div
          className={`mt-4 p-3 rounded-lg text-xs flex items-center justify-between transition-all ${
            alert.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
              : alert.type === 'error'
              ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
              : 'bg-indigo-500/15 border border-indigo-500/40 text-indigo-300'
          }`}
        >
          <span>{alert.message}</span>
          <button
            onClick={onDismissAlert}
            className="text-slate-400 hover:text-white font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
};
