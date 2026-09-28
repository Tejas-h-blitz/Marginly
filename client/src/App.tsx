import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { KpiGrid } from './components/KpiGrid';
import { ImportSection } from './components/ImportSection';
import { CostChart } from './components/CostChart';
import { CustomerTable } from './components/CustomerTable';
import { PricingModal } from './components/PricingModal';
import {
  CustomerBreakdown,
  UsageSummary,
  ModelPricingItem,
  PricingResponse,
  AlertNotification
} from './types';

const INITIAL_SUMMARY: UsageSummary = {
  totalCustomers: 0,
  totalRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  totalCost: 0,
  topCustomer: null
};

export function App() {
  const [summary, setSummary] = useState<UsageSummary>(INITIAL_SUMMARY);
  const [customers, setCustomers] = useState<CustomerBreakdown[]>([]);
  const [pricing, setPricing] = useState<Record<string, ModelPricingItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [alert, setAlert] = useState<AlertNotification | null>(null);

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlert({ message, type });
  };

  const loadData = useCallback(async () => {
    try {
      const [summaryRes, customersRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/customers')
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
  }, []);

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
    showAlert('Loading sample usage data across 8 accounts...', 'info');
    try {
      const res = await fetch('/api/load-sample', { method: 'POST' });
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

  const handleExportCsv = () => {
    window.location.href = '/api/export';
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear all usage data?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/clear', { method: 'POST' });
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
      const res = await fetch('/api/upload', {
        method: 'POST',
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
      const res = await fetch('/api/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
      <Navbar
        onLoadSample={handleLoadSample}
        onExportCsv={handleExportCsv}
        onOpenPricing={() => setIsPricingOpen(true)}
        onClearData={handleClearData}
        loading={loading}
      />

      <KpiGrid summary={summary} />

      <ImportSection
        onUploadFile={handleUploadFile}
        onPasteSubmit={handlePasteSubmit}
        alert={alert}
        onDismissAlert={() => setAlert(null)}
        loading={loading}
      />

      <CostChart customers={customers} />

      <CustomerTable customers={customers} />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        pricing={pricing}
      />
    </div>
  );
}

export default App;
