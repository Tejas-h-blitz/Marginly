import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ClerkProviderWrapper } from './context/ClerkProviderWrapper.js';
import { LandingPage } from './components/landing/LandingPage.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { AppNavbar } from './components/app/AppNavbar.js';
import { ConcentrationBanner } from './components/app/ConcentrationBanner.js';
import { ImportDrawer } from './components/app/ImportDrawer.js';
import { KpiGrid } from './components/KpiGrid.js';
import { CostChart } from './components/CostChart.js';
import { CustomerTable } from './components/CustomerTable.js';
import { PricingModal } from './components/PricingModal.js';
import {
  CustomerBreakdown,
  UsageSummary,
  ModelPricingItem,
  PricingResponse,
  AlertNotification
} from './types/index.js';

const INITIAL_SUMMARY: UsageSummary = {
  totalCustomers: 0,
  totalRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  totalCost: 0,
  topCustomer: null
};

function MainAppContent() {
  const { isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const [summary, setSummary] = useState<UsageSummary>(INITIAL_SUMMARY);
  const [customers, setCustomers] = useState<CustomerBreakdown[]>([]);
  const [pricing, setPricing] = useState<Record<string, ModelPricingItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState<AlertNotification | null>(null);

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlert({ message, type });
  };

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {};
    try {
      if ((window as any).Clerk?.session) {
        const token = await (window as any).Clerk.session.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        if ((window as any).Clerk.user?.id) {
          headers['x-user-id'] = (window as any).Clerk.user.id;
        }
      }
    } catch {
      // Fallback
    }

    if (!headers['Authorization'] && user?.id) {
      headers['x-user-id'] = user.id;
    }
    return headers;
  }, [user]);

  const loadData = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const [summaryRes, customersRes] = await Promise.all([
        fetch('/api/summary', { headers: authHeaders }),
        fetch('/api/customers', { headers: authHeaders })
      ]);

      if (summaryRes.ok) {
        const sumData: UsageSummary = await summaryRes.json();
        setSummary(sumData);
      }

      if (customersRes.ok) {
        const custData: CustomerBreakdown[] = await customersRes.json();
        setCustomers(custData);
      }
    } catch (err) {
      console.error('Failed to load usage data:', err);
    }
  }, [getAuthHeaders]);

  const loadPricing = useCallback(async () => {
    try {
      const res = await fetch('/api/pricing');
      if (res.ok) {
        const data: PricingResponse = await res.json();
        setPricing(data.models);
      }
    } catch (err) {
      console.error('Failed to load pricing:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadPricing();
  }, [loadData, loadPricing]);

  const handleLoadSample = async () => {
    setLoading(true);
    showAlert('Loading sample usage logs...', 'info');
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/load-sample', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load sample');

      showAlert(data.message, 'success');
      await loadData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Error loading sample data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/export', { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customer_cost_breakdown.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Error exporting CSV', 'error');
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear all usage data?')) return;
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/clear', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      showAlert(data.message, 'success');
      await loadData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Error clearing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    setLoading(true);
    showAlert(`Uploading '${file.name}'...`, 'info');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      showAlert(data.message, 'success');
      await loadData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Failed to upload file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSubmit = async (content: string, format: 'csv' | 'json') => {
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
        body: JSON.stringify({ content, format })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Processing failed');

      showAlert(data.message, 'success');
      await loadData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Failed to process pasted data', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {currentView === 'landing' ? (
        <LandingPage
          onLaunchApp={() => setCurrentView('app')}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          isAuthenticated={isAuthenticated}
        />
      ) : (
        <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans">
          {/* Top Application Navbar */}
          <AppNavbar
            onOpenImport={() => setIsImportOpen(true)}
            onOpenPricing={() => setIsPricingOpen(true)}
            onClearData={handleClearData}
            onBackToLanding={() => setCurrentView('landing')}
            totalCustomers={summary.totalCustomers}
          />

          {/* Main Dashboard Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 pb-24 space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 border border-white/[0.08] p-4 rounded-2xl">
              <div>
                <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>Customer Cost &amp; Margin Intelligence</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track per-account LLM expenditure, identify power users, and preserve gross margins.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                >
                  <svg className="w-3.5 h-3.5 stroke-slate-950 fill-none stroke-2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Import Logs</span>
                </button>

                {summary.totalCustomers === 0 && (
                  <button
                    onClick={handleLoadSample}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
                  >
                    <span>Load Demo Data</span>
                  </button>
                )}

                {summary.totalCustomers > 0 && (
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export CSV</span>
                  </button>
                )}
              </div>
            </div>

            {/* Pareto 80/20 Concentration Risk Alert */}
            <ConcentrationBanner
              customers={customers}
              totalCost={summary.totalCost}
            />

            {/* KPI Cards */}
            <KpiGrid summary={summary} />

            {/* Recharts Customer Spend Distribution */}
            <CostChart customers={customers} />

            {/* Customer Table with Sorting and Filter Pills */}
            <CustomerTable customers={customers} />
          </main>

          {/* Ingestion Slide-out Drawer */}
          <ImportDrawer
            isOpen={isImportOpen}
            onClose={() => setIsImportOpen(false)}
            onUploadFile={handleUploadFile}
            onPasteSubmit={handlePasteSubmit}
            onLoadSample={handleLoadSample}
            alert={alert}
            onDismissAlert={() => setAlert(null)}
            loading={loading}
          />

          {/* Model Pricing Reference Modal */}
          <PricingModal
            isOpen={isPricingOpen}
            onClose={() => setIsPricingOpen(false)}
            pricing={pricing}
          />
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setCurrentView('app')}
      />

      {/* Floating Notification Toast */}
      {alert && (
        <div className="fixed bottom-5 right-5 z-50 animate-fadeIn">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-medium backdrop-blur-xl ${
              alert.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : alert.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-slate-900/90 border-white/20 text-slate-200'
            }`}
          >
            <span>{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              className="text-slate-400 hover:text-white p-0.5"
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
    <ClerkProviderWrapper>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ClerkProviderWrapper>
  );
}

export default App;
