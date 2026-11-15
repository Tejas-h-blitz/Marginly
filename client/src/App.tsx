import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ClerkProviderWrapper } from './context/ClerkProviderWrapper.js';
import { LandingPage } from './components/landing/LandingPage.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { AppNavbar } from './components/app/AppNavbar.js';
import { ConcentrationBanner } from './components/app/ConcentrationBanner.js';
import { DataQualityStrip } from './components/app/DataQualityStrip.js';
import { ImportDrawer } from './components/app/ImportDrawer.js';
import { CustomerDetailModal } from './components/app/CustomerDetailModal.js';
import { DuplicateImportModal } from './components/app/DuplicateImportModal.js';
import { KpiGrid } from './components/KpiGrid.js';
import { CostChart } from './components/CostChart.js';
import { CustomerTable } from './components/CustomerTable.js';
import { PricingModal } from './components/PricingModal.js';
import { InlineSpinner } from './components/InlineSpinner.js';
import { formatFixedUsd, formatPercent } from './money.js';
import {
  CustomerBreakdown,
  UsageSummary,
  ModelPricingItem,
  PricingResponse,
  AlertNotification,
  PriceVersionItem,
  ImportHistoryItem,
  CustomerDetail,
  DuplicateImportPreview
} from './types/index.js';

type PendingDuplicateImport = {
  preview: DuplicateImportPreview;
  source:
    | { kind: 'file'; file: File }
    | { kind: 'paste'; content: string; format: 'csv' | 'json' };
};

const INITIAL_SUMMARY: UsageSummary = {
  month: 'all',
  availableMonths: [],
  untimestampedRequests: 0,
  totalCustomers: 0,
  totalRequests: 0,
  pricedRequests: 0,
  avgCostPerRequest: '0',
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  totalCost: '0',
  totalRevenueUsd: null,
  totalMarginUsd: null,
  blendedMarginPercent: null,
  unprofitableCustomers: 0,
  topCustomer: null,
  unpricedModels: []
};

function MainAppContent() {
  const { isAuthenticated, getToken } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const [summary, setSummary] = useState<UsageSummary>(INITIAL_SUMMARY);
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();
  const [customers, setCustomers] = useState<CustomerBreakdown[]>([]);
  const [pricing, setPricing] = useState<Record<string, ModelPricingItem> | null>(null);
  const [upcomingRates, setUpcomingRates] = useState<PriceVersionItem[]>([]);
  const [customRates, setCustomRates] = useState<PriceVersionItem[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [pendingDuplicateImport, setPendingDuplicateImport] = useState<PendingDuplicateImport | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [customerDetailLoading, setCustomerDetailLoading] = useState(false);
  const [customerDetailError, setCustomerDetailError] = useState<string | null>(null);
  const [mergingCustomer, setMergingCustomer] = useState(false);
  const [prefilledRateModel, setPrefilledRateModel] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [alert, setAlert] = useState<AlertNotification | null>(null);

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlert({ message, type });
  };

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {};
    try {
      const token = await getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if ((window as any).Clerk?.session) {
        const windowToken = await (window as any).Clerk.session.getToken();
        if (windowToken) {
          headers['Authorization'] = `Bearer ${windowToken}`;
        }
      }
    } catch (err) {
      console.warn('Failed to retrieve authentication token:', err);
    }

    return headers;
  }, [getToken]);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const authHeaders = await getAuthHeaders();
      const monthQuery = selectedMonth ? `?month=${encodeURIComponent(selectedMonth)}` : '';
      const [summaryRes, customersRes] = await Promise.all([
        fetch(`/api/summary${monthQuery}`, { headers: authHeaders, credentials: 'include' }),
        fetch(`/api/customers${monthQuery}`, { headers: authHeaders, credentials: 'include' })
      ]);

      if (summaryRes.ok) {
        const sumData: UsageSummary = await summaryRes.json();
        setSummary(sumData);
        if (selectedMonth === undefined) setSelectedMonth(sumData.month);
      }

      if (customersRes.ok) {
        const custData: CustomerBreakdown[] = await customersRes.json();
        setCustomers(custData);
      }
    } catch (err) {
      console.error('Failed to load usage data:', err);
    }
  }, [getAuthHeaders, isAuthenticated, selectedMonth]);

  const loadPricing = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/pricing', { headers: authHeaders, credentials: 'include' });
      if (res.ok) {
        const data: PricingResponse = await res.json();
        setPricing(data.models);
        setUpcomingRates(data.upcoming);
        setCustomRates(data.custom);
      }
    } catch (err) {
      console.error('Failed to load pricing:', err);
    }
  }, [getAuthHeaders, isAuthenticated]);

  const loadImportHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/import-history', { headers: authHeaders, credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load import history.');
      setImportHistory(await res.json());
    } catch (err) {
      console.error('Failed to load import history:', err);
      showAlert(err instanceof Error ? err.message : 'Failed to load import history.', 'error');
    }
  }, [getAuthHeaders, isAuthenticated]);

  useEffect(() => {
    if (isImportOpen) void loadImportHistory();
  }, [isImportOpen, loadImportHistory]);

  const loadCustomerDetail = useCallback(async (
    customerId: string,
    month: string,
    signal: AbortSignal
  ) => {
    setCustomerDetailLoading(true);
    setCustomerDetailError(null);
    setCustomerDetail(null);
    try {
      const authHeaders = await getAuthHeaders();
      const query = month ? `?month=${encodeURIComponent(month)}` : '';
      const response = await fetch(
        `/api/customers/${encodeURIComponent(customerId)}/detail${query}`,
        { headers: authHeaders, credentials: 'include', signal }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load customer details.');
      setCustomerDetail(data);
    } catch (err) {
      if (signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Failed to load customer details.';
      setCustomerDetailError(message);
    } finally {
      if (!signal.aborted) setCustomerDetailLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!selectedCustomerId) return;
    const controller = new AbortController();
    void loadCustomerDetail(selectedCustomerId, selectedMonth ?? summary.month, controller.signal);
    return () => controller.abort();
  }, [loadCustomerDetail, selectedCustomerId, selectedMonth, summary.month]);

  const handleMergeCustomer = async (sourceCustomerId: string, targetCustomerId: string): Promise<boolean> => {
    setMergingCustomer(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/customers/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({
          source_customer_id: sourceCustomerId,
          target_customer_id: targetCustomerId
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to merge customers.');
      showAlert(data.message, 'success');
      setSelectedCustomerId(null);
      await loadData();
      return true;
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Failed to merge customers.', 'error');
      return false;
    } finally {
      setMergingCustomer(false);
    }
  };

  const handleSaveCustomRate = async (
    rate: { model_name: string; input_per_million: string; output_per_million: string; effective_from: string },
    id?: string
  ): Promise<boolean> => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/custom-rates', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify(id ? { ...rate, id } : rate)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save custom rate.');
      showAlert(`Custom rate saved for ${data.rate.modelName}.`, 'success');
      await Promise.all([loadPricing(), loadData()]);
      return true;
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Failed to save custom rate.', 'error');
      return false;
    }
  };

  const handleDeleteCustomRate = async (id: string): Promise<boolean> => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/custom-rates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete custom rate.');
      showAlert('Custom rate deleted.', 'success');
      await Promise.all([loadPricing(), loadData()]);
      return true;
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Failed to delete custom rate.', 'error');
      return false;
    }
  };

  useEffect(() => {
    loadData();
    loadPricing();
  }, [loadData, loadPricing]);

  const handleLaunchApp = () => {
    if (isAuthenticated) {
      setCurrentView('app');
    } else {
      setAuthInitialMode('signup');
      setIsAuthModalOpen(true);
    }
  };

  const handleOpenSignIn = () => {
    setAuthInitialMode('signin');
    setIsAuthModalOpen(true);
  };

  const handleLoadSample = async () => {
    setLoading(true);
    showAlert('Loading sample usage logs...', 'info');
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/load-sample', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load sample');

      showAlert(data.message, 'success');
      await loadData();
      await loadImportHistory();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Error loading sample data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const authHeaders = await getAuthHeaders();
      const monthQuery = selectedMonth ? `?month=${encodeURIComponent(selectedMonth)}` : '';
      const res = await fetch(`/api/export${monthQuery}`, { headers: authHeaders, credentials: 'include' });
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customer_margin_breakdown.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showAlert('Customer margin CSV exported successfully.', 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Error exporting CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleSaveRevenue = async (customerId: string, value: string | null, month: string): Promise<boolean> => {
    try {
      const effectiveMonth = month === 'all' ? new Date().toISOString().slice(0, 7) : month;
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}/revenue`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({ monthly_revenue_usd: value, effective_month: effectiveMonth })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save monthly revenue.');
      showAlert(`Monthly revenue saved for ${customerId} for ${effectiveMonth}.`, 'success');
      await loadData();
      return true;
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Failed to save monthly revenue.', 'error');
      return false;
    }
  };

  const handleRevenueImport = async (file: File): Promise<boolean> => {
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/revenue/import', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import revenue CSV.');
      showAlert(data.message, 'success');
      await loadData();
      return true;
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Failed to import revenue CSV.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Permanently remove your usage records, customer revenue, import history, and custom pricing rates? This cannot be undone.')) return;
    setClearing(true);
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/clear', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear usage data.');
      showAlert(data.message, 'success');
      await Promise.all([loadData(), loadPricing(), loadImportHistory()]);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Error clearing data', 'error');
    } finally {
      setClearing(false);
      setLoading(false);
    }
  };

  const handleUploadFile = async (file: File, duplicateMode: 'detect' | 'skip' | 'allow' = 'detect'): Promise<boolean> => {
    if (file.size > 10 * 1024 * 1024) {
      showAlert('Files must be 10 MB or smaller.', 'error');
      return false;
    }
    setLoading(true);
    showAlert(`Uploading '${file.name}'...`, 'info');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('duplicate_mode', duplicateMode);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (res.status === 409 && data.code === 'DUPLICATES') {
        setPendingDuplicateImport({
          preview: data as DuplicateImportPreview,
          source: { kind: 'file', file }
        });
        return false;
      }
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      showAlert(data.message, 'success');
      await loadData();
      await loadImportHistory();
      return true;
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Failed to upload file', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSubmit = async (
    content: string,
    format: 'csv' | 'json',
    duplicateMode: 'detect' | 'skip' | 'allow' = 'detect'
  ): Promise<boolean> => {
    if (new TextEncoder().encode(content).byteLength > 10 * 1024 * 1024) {
      showAlert('Pasted usage data must be 10 MB or smaller.', 'error');
      return false;
    }
    setLoading(true);
    showAlert('Processing pasted data...', 'info');

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/paste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        credentials: 'include',
        body: JSON.stringify({ content, format, duplicate_mode: duplicateMode })
      });
      const data = await res.json();
      if (res.status === 409 && data.code === 'DUPLICATES') {
        setPendingDuplicateImport({
          preview: data as DuplicateImportPreview,
          source: { kind: 'paste', content, format }
        });
        return false;
      }
      if (!res.ok) throw new Error(data.error || 'Processing failed');

      showAlert(data.message, 'success');
      await loadData();
      await loadImportHistory();
      return true;
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Failed to process pasted data', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateDecision = async (duplicateMode: 'skip' | 'allow') => {
    if (!pendingDuplicateImport) return;
    const pending = pendingDuplicateImport;
    const succeeded = pending.source.kind === 'file'
      ? await handleUploadFile(pending.source.file, duplicateMode)
      : await handlePasteSubmit(pending.source.content, pending.source.format, duplicateMode);
    if (succeeded) {
      setPendingDuplicateImport(null);
      setIsImportOpen(false);
    }
  };

  const handleUndoImport = async (batchId: string): Promise<void> => {
    if (!window.confirm('Undo this import? Only records added by this batch will be removed. This cannot be undone.')) return;
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/import-history/${encodeURIComponent(batchId)}/undo`, {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to undo import.');
      showAlert(data.message, 'success');
      await Promise.all([loadData(), loadImportHistory()]);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Failed to undo import.', 'error');
    }
  };

  const insightLine = (() => {
    if (!customers || customers.length === 0 || Number(summary.totalCost) <= 0) return null;
    const topCustomer = customers[0];
    if (!topCustomer || Number(topCustomer.totalCost) <= 0) return null;

    const topShare = formatPercent(topCustomer.percentOfTotal, 1);
    let line = `Top spender: ${topCustomer.customerId} accounts for ${topShare} of total spend ($${formatFixedUsd(topCustomer.totalCost, 4)}).`;

    const hasRevenue = customers.some(c => c.monthlyRevenueUsd !== null);
    if (hasRevenue) {
      const unprofitableCount = summary.unprofitableCustomers;
      if (unprofitableCount > 0) {
        line += ` ${unprofitableCount} ${unprofitableCount === 1 ? 'customer is' : 'customers are'} unprofitable.`;
      } else {
        line += ` All accounts with revenue are profitable.`;
      }
    }
    return line;
  })();

  return (
    <>
      {currentView === 'landing' ? (
        <LandingPage
          onLaunchApp={handleLaunchApp}
          onOpenAuth={handleOpenSignIn}
        />
      ) : (
        <div className="app-canvas min-h-screen text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
          {/* Top Application Navbar */}
          <AppNavbar
            onOpenPricing={() => {
              setPrefilledRateModel('');
              setIsPricingOpen(true);
            }}
            onClearData={handleClearData}
            onBackToLanding={() => setCurrentView('landing')}
            totalCustomers={summary.totalCustomers}
            clearing={clearing}
          />

          {/* Main Dashboard Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-20 space-y-4">
            
            {/* Action Bar */}
            <div className="dashboard-enter surface-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-zinc-800/80 p-4 rounded-xl" style={{ animationDelay: '0ms' }}>
              <div>
                <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Customer Cost &amp; Unit Economics
                </h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Per-account LLM expenditure audit, power user detection, and margin protection.
                </p>
                {insightLine && (
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-1">
                    {insightLine}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Period</span>
                  <select
                    value={selectedMonth ?? summary.month}
                    onChange={event => setSelectedMonth(event.target.value)}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-400"
                  >
                    <option value="all">All time</option>
                    {summary.availableMonths.slice().reverse().map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </label>
                {summary.totalCustomers === 0 && (
                  <button
                    onClick={handleLoadSample}
                    disabled={loading}
                    className="interaction-button flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200"
                  >
                    {loading ? <><InlineSpinner /> Loading...</> : <span>Load Sample Data</span>}
                  </button>
                )}

                {summary.totalCustomers > 0 && (
                  <button
                    onClick={handleExportCsv}
                    disabled={exporting}
                    className="interaction-button flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-xs disabled:opacity-60"
                  >
                    {exporting ? <InlineSpinner /> : <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>}
                    <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
                  </button>
                )}

                <button
                  onClick={() => setIsImportOpen(true)}
                  disabled={loading}
                  className="interaction-button flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium text-xs shadow-xs disabled:opacity-60"
                >
                  {loading ? <InlineSpinner /> : <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>}
                  <span>{loading ? 'Working...' : 'Import Logs'}</span>
                </button>
              </div>
            </div>

            {summary.month === 'all' && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 -mt-2">
                All-time view shows costs only. Select a month to compare revenue and margin.
              </p>
            )}

            {/* Data Quality Strip (consolidates untimestamped records and unpriced models) */}
            <DataQualityStrip
              untimestampedRequests={summary.untimestampedRequests}
              unpricedModels={summary.unpricedModels}
              month={summary.month}
              onAddRate={modelName => {
                setPrefilledRateModel(modelName);
                setIsPricingOpen(true);
              }}
            />

            {/* Pareto 80/20 Concentration Risk Alert */}
            <ConcentrationBanner
              customers={customers}
              totalCost={summary.totalCost}
            />

            {/* KPI Cards */}
            <KpiGrid summary={summary} loading={loading} />

            {/* Recharts Customer Spend Distribution */}
            <CostChart customers={customers} />

            {/* Customer Table with Sorting and Filter Pills */}
            <CustomerTable
              customers={customers}
              month={summary.month}
              onSaveRevenue={handleSaveRevenue}
              onViewCustomer={setSelectedCustomerId}
              onImport={() => setIsImportOpen(true)}
              onCopyError={message => showAlert(message, 'error')}
              loading={loading}
            />
          </main>

          {/* Ingestion Slide-out Drawer */}
          <ImportDrawer
            isOpen={isImportOpen}
            onClose={() => setIsImportOpen(false)}
            onUploadFile={handleUploadFile}
            onPasteSubmit={handlePasteSubmit}
            onLoadSample={handleLoadSample}
            onImportRevenue={handleRevenueImport}
            onUndoImport={handleUndoImport}
            loading={loading}
            importHistory={importHistory}
          />

          <DuplicateImportModal
            preview={pendingDuplicateImport?.preview ?? null}
            loading={loading}
            onChoose={mode => void handleDuplicateDecision(mode)}
            onCancel={() => setPendingDuplicateImport(null)}
          />

          {/* Model Pricing Reference Modal */}
          <PricingModal
            isOpen={isPricingOpen}
            onClose={() => setIsPricingOpen(false)}
            pricing={pricing}
            upcoming={upcomingRates}
            customRates={customRates}
            initialModelName={prefilledRateModel}
            onSaveCustomRate={handleSaveCustomRate}
            onDeleteCustomRate={handleDeleteCustomRate}
          />

          <CustomerDetailModal
            customerId={selectedCustomerId}
            detail={customerDetail}
            customers={customers}
            loading={customerDetailLoading}
            error={customerDetailError}
            merging={mergingCustomer}
            onClose={() => {
              setSelectedCustomerId(null);
              setCustomerDetail(null);
              setCustomerDetailError(null);
            }}
            onMerge={handleMergeCustomer}
          />
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setCurrentView('app')}
        initialMode={authInitialMode}
      />

      {/* Floating Notification Toast */}
      {alert && (
        <div className="toast-enter fixed bottom-4 right-4 z-50" role={alert.type === 'error' ? 'alert' : 'status'} aria-live={alert.type === 'error' ? 'assertive' : 'polite'}>
          <div
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg shadow-lg border text-xs font-medium ${
              alert.type === 'success'
                ? 'bg-white dark:bg-[#141518] border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                : alert.type === 'error'
                ? 'bg-white dark:bg-[#141518] border-rose-500/40 text-rose-800 dark:text-rose-300'
                : 'bg-white dark:bg-[#141518] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <span>{alert.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setAlert(null)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ml-1 text-sm leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ClerkProviderWrapper>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </ClerkProviderWrapper>
    </ThemeProvider>
  );
}

export default App;
