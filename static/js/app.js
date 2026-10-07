
// AI Usage Cost Tracker - Client Logic

let costChart = null;
let currentCustomers = [];
let pricingData = null;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initDropzone();
  initPasteActions();
  initButtons();
  initPricingModal();
  initSearch();
  
  // Initial load
  loadData();
  loadPricing();
});

// ============================================================
// API Calls & Data Refresh
// ============================================================
async function loadData() {
  try {
    const [summaryRes, customersRes] = await Promise.all([
      fetch('/api/summary'),
      fetch('/api/customers')
    ]);

    if (!summaryRes.ok || !customersRes.ok) {
      throw new Error('Failed to fetch data from server');
    }

    const summary = await summaryRes.json();
    currentCustomers = await customersRes.json();

    updateKPIs(summary);
    renderTable(currentCustomers);
    renderChart(currentCustomers);
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

async function loadPricing() {
  try {
    const res = await fetch('/api/pricing');
    if (res.ok) {
      pricingData = await res.json();
      renderPricingTable(pricingData);
    }
  } catch (err) {
    console.error('Error loading pricing:', err);
  }
}

// ============================================================
// KPI Cards Updating
// ============================================================
function updateKPIs(summary) {
  const totalCostEl = document.getElementById('kpi-total-cost');
  const totalCustomersEl = document.getElementById('kpi-total-customers');
  const totalRequestsEl = document.getElementById('kpi-total-requests');
  const totalTokensEl = document.getElementById('kpi-total-tokens');
  const topCustomerEl = document.getElementById('kpi-top-customer');
  const topCustomerCostEl = document.getElementById('kpi-top-customer-cost');

  const cost = summary.total_cost || 0;
  totalCostEl.textContent = `$${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  totalCustomersEl.textContent = (summary.total_customers || 0).toLocaleString();
  totalRequestsEl.textContent = (summary.total_requests || 0).toLocaleString();
  totalTokensEl.textContent = (summary.total_tokens || 0).toLocaleString();

  if (summary.top_customer) {
    topCustomerEl.textContent = summary.top_customer.customer_id;
    topCustomerCostEl.textContent = `$${summary.top_customer.cost.toFixed(2)} total spend`;
  } else {
    topCustomerEl.textContent = 'None';
    topCustomerCostEl.textContent = 'No data ingested';
  }
}

// ============================================================
// Chart.js Visualization
// ============================================================
function renderChart(customers) {
  const ctx = document.getElementById('customer-cost-chart');
  if (!ctx || typeof Chart === 'undefined') return;

  if (costChart) {
    costChart.destroy();
  }

  if (!customers || customers.length === 0) {
    ctx.style.display = 'none';
    return;
  }
  ctx.style.display = 'block';

  // Limit to top 10 for clean display
  const topCustomers = customers.slice(0, 10);
  const labels = topCustomers.map(c => c.customer_id);
  const data = topCustomers.map(c => c.total_cost);
  
  // Highlighting colors: first 2 are warning colors, rest are violet/cyan
  const backgroundColors = topCustomers.map((_, i) => {
    if (i === 0) return 'rgba(244, 63, 94, 0.85)'; // Rose/Red for #1
    if (i === 1) return 'rgba(245, 158, 11, 0.85)'; // Amber for #2
    return 'rgba(99, 102, 241, 0.8)';               // Indigo for others
  });

  const borderColors = topCustomers.map((_, i) => {
    if (i === 0) return '#f43f5e';
    if (i === 1) return '#f59e0b';
    return '#818cf8';
  });

  costChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Cost ($ USD)',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 6,
        barThickness: 22
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bars
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              const cust = topCustomers[context.dataIndex];
              return [
                ` Cost: $${cust.total_cost.toFixed(4)}`,
                ` Requests: ${cust.total_requests.toLocaleString()}`,
                ` Tokens: ${cust.total_tokens.toLocaleString()} (${cust.percent_of_total}% of spend)`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94a3b8',
            callback: (val) => `$${val}`
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#cbd5e1',
            font: { family: "'JetBrains Mono', monospace", size: 12 }
          }
        }
      }
    }
  });
}

// ============================================================
// Table Rendering & Filtering
// ============================================================
function renderTable(customers, filter = '') {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  const filtered = customers.filter(c => 
    c.customer_id.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    if (customers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            <p>No usage data loaded yet.</p>
            <p style="font-size: 0.8rem; margin-top: 4px;">Click <strong>Load Sample Data</strong> above or upload a CSV to see per-customer costs.</p>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state">
            <p>No customers matching "<strong>${escapeHtml(filter)}</strong>"</p>
          </td>
        </tr>
      `;
    }
    return;
  }

  let html = '';
  filtered.forEach((c, index) => {
    const rank = index + 1;
    let rankBadgeClass = '';
    if (rank === 1) rankBadgeClass = 'top-1';
    else if (rank === 2) rankBadgeClass = 'top-2';
    else if (rank === 3) rankBadgeClass = 'top-3';

    const isHighCost = c.percent_of_total >= 25 || rank === 1;
    const barClass = isHighCost ? 'pct-fill high' : 'pct-fill';

    html += `
      <tr>
        <td><span class="rank-badge ${rankBadgeClass}">#${rank}</span></td>
        <td>
          <div class="customer-cell">
            <span class="cust-name">${escapeHtml(c.customer_id)}</span>
          </div>
        </td>
        <td>${c.total_requests.toLocaleString()}</td>
        <td>${c.total_input_tokens.toLocaleString()}</td>
        <td>${c.total_output_tokens.toLocaleString()}</td>
        <td>${c.total_tokens.toLocaleString()}</td>
        <td>
          <div class="pct-bar-wrapper">
            <div class="pct-track">
              <div class="${barClass}" style="width: ${Math.min(100, Math.max(2, c.percent_of_total))}%"></div>
            </div>
            <span class="pct-text">${c.percent_of_total}%</span>
          </div>
        </td>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: #94a3b8;">
          $${c.avg_cost_per_request.toFixed(4)}
        </td>
        <td class="cost-cell ${isHighCost ? 'high-spend' : ''}">
          $${c.total_cost.toFixed(4)}
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// ============================================================
// File Upload & Drag and Drop
// ============================================================
function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  if (!dropzone || !fileInput) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length > 0) {
      uploadFile(fileInput.files[0]);
    }
  });
}

async function uploadFile(file) {
  showAlert(`Uploading and processing '${file.name}'...`, 'info');
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Upload failed');
    }

    showAlert(data.message, 'success');
    loadData();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'error');
  }
}

// ============================================================
// Paste Actions
// ============================================================
function initPasteActions() {
  const submitBtn = document.getElementById('btn-submit-paste');
  const templateBtn = document.getElementById('btn-insert-template');
  const textarea = document.getElementById('paste-input');

  if (templateBtn && textarea) {
    templateBtn.addEventListener('click', () => {
      const isJson = document.querySelector('input[name="paste-format"]:checked')?.value === 'json';
      if (isJson) {
        textarea.value = JSON.stringify([
          {
            "customer_id": "cust_enterprise_alpha",
            "timestamp": "2026-09-22T12:00:00Z",
            "model_name": "gpt-4o",
            "input_tokens": 15000,
            "output_tokens": 3200
          },
          {
            "customer_id": "cust_growth_beta",
            "timestamp": "2026-09-22T12:05:00Z",
            "model_name": "claude-3-5-sonnet",
            "input_tokens": 28000,
            "output_tokens": 4900
          },
          {
            "customer_id": "cust_starter_gamma",
            "timestamp": "2026-09-22T12:10:00Z",
            "model_name": "gpt-4o-mini",
            "input_tokens": 3500,
            "output_tokens": 800
          }
        ], null, 2);
      } else {
        textarea.value = [
          "customer_id,timestamp,model_name,input_tokens,output_tokens",
          "cust_enterprise_alpha,2026-09-22T12:00:00Z,gpt-4o,15000,3200",
          "cust_growth_beta,2026-09-22T12:05:00Z,claude-3-5-sonnet,28000,4900",
          "cust_starter_gamma,2026-09-22T12:10:00Z,gpt-4o-mini,3500,800"
        ].join('\n');
      }
    });
  }

  if (submitBtn && textarea) {
    submitBtn.addEventListener('click', async () => {
      const content = textarea.value.trim();
      if (!content) {
        showAlert('Please paste some CSV or JSON data first.', 'error');
        return;
      }

      const format = document.querySelector('input[name="paste-format"]:checked')?.value || 'csv';
      showAlert('Processing pasted usage data...', 'info');

      try {
        const res = await fetch('/api/paste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, format })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Processing failed');
        }

        showAlert(data.message, 'success');
        loadData();
      } catch (err) {
        showAlert(`Error: ${err.message}`, 'error');
      }
    });
  }
}

// ============================================================
// Buttons & Quick Actions
// ============================================================
function initButtons() {
  // Load Sample Data
  const sampleBtn = document.getElementById('btn-load-sample');
  if (sampleBtn) {
    sampleBtn.addEventListener('click', async () => {
      showAlert('Loading sample data with 8 customer accounts...', 'info');
      try {
        const res = await fetch('/api/load-sample', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to load sample');
        showAlert(data.message, 'success');
        loadData();
      } catch (err) {
        showAlert(`Error: ${err.message}`, 'error');
      }
    });
  }

  // Export CSV
  const exportBtn = document.getElementById('btn-export-csv');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      window.location.href = '/api/export';
    });
  }

  // Clear Data
  const clearBtn = document.getElementById('btn-clear-data');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to clear all usage data?')) return;
      try {
        const res = await fetch('/api/clear', { method: 'POST' });
        const data = await res.json();
        showAlert(data.message, 'success');
        loadData();
      } catch (err) {
        showAlert(`Error: ${err.message}`, 'error');
      }
    });
  }

  // Dismiss Alert
  const dismissBtn = document.getElementById('alert-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      document.getElementById('import-alert')?.classList.remove('visible');
    });
  }
}

// ============================================================
// Tabs
// ============================================================
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId)?.classList.add('active');
    });
  });
}

// ============================================================
// Search
// ============================================================
function initSearch() {
  const searchInput = document.getElementById('table-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderTable(currentCustomers, e.target.value.trim());
    });
  }
}

// ============================================================
// Pricing Modal
// ============================================================
function initPricingModal() {
  const openBtn = document.getElementById('btn-open-pricing');
  const closeBtn = document.getElementById('pricing-close-btn');
  const modal = document.getElementById('pricing-modal');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.add('active'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
}

function renderPricingTable(pricing) {
  const tbody = document.getElementById('pricing-tbody');
  if (!tbody || !pricing || !pricing.models) return;

  let html = '';
  for (const [key, info] of Object.entries(pricing.models)) {
    const provider = info.provider || 'Other';
    let tagClass = 'other';
    if (provider.toLowerCase().includes('openai')) tagClass = 'openai';
    if (provider.toLowerCase().includes('anthropic')) tagClass = 'anthropic';

    html += `
      <tr>
        <td><strong style="font-family: 'JetBrains Mono', monospace;">${escapeHtml(key)}</strong></td>
        <td><span class="pricing-tag ${tagClass}">${escapeHtml(provider)}</span></td>
        <td style="font-family: 'JetBrains Mono', monospace;">$${info.costPer1kInput.toFixed(5)}</td>
        <td style="font-family: 'JetBrains Mono', monospace;">$${info.costPer1kOutput.toFixed(5)}</td>
      </tr>
    `;
  }
  tbody.innerHTML = html;
}

// ============================================================
// Helpers
// ============================================================
function showAlert(message, type = 'info') {
  const alertEl = document.getElementById('import-alert');
  const msgEl = document.getElementById('alert-message');
  if (!alertEl || !msgEl) return;

  msgEl.textContent = message;
  alertEl.className = `alert visible ${type}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
