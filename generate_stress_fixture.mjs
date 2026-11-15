import fs from 'fs';
import path from 'path';

// Models and pricing:
// gpt-4o: 0.0025 in / 0.0100 out per 1k
// gpt-4o-mini: 0.00015 in / 0.0006 out per 1k
// claude-3-5-sonnet: 0.0030 in / 0.0150 out per 1k
// gemini-2.5-flash: 0.00030 in / 0.00250 out per 1k

const rows = [];

function addRow(customerId, timestamp, modelName, inputTokens, outputTokens) {
  rows.push({
    customer_id: customerId,
    timestamp,
    model_name: modelName,
    input_tokens: inputTokens,
    output_tokens: outputTokens
  });
}

// 1. August 2026:
// 1 active customer (cust_16_august_only), 3 requests, 24,000 input, 4,500 output, cost 0.01845
// Boundary: 2026-08-31T23:59:59Z
addRow('cust_16_august_only', '2026-08-10T10:00:00Z', 'gemini-2.5-flash', 8000, 1500);
addRow('cust_16_august_only', '2026-08-20T10:00:00Z', 'gemini-2.5-flash', 8000, 1500);
addRow('cust_16_august_only', '2026-08-31T23:59:59Z', 'gemini-2.5-flash', 8000, 1500);

// 2. September 2026:
// 5 active customers: cust_01, cust_02, cust_03, cust_04_highvolume, cust_17_month_boundary
// 39 requests total, cost about 5.869
// cust_04_highvolume has 15 requests (one at exactly 2026-09-01T00:00:00Z)
// cust_17_month_boundary has 1 request (e.g. 2026-09-15T12:00:00Z)
// cust_01 has 8 requests
// cust_02 has 8 requests
// cust_03 has 7 requests
// (15 + 1 + 8 + 8 + 7 = 39 requests)

// Target total cost: 5.869
// Let cust_04_highvolume 15 requests on gpt-4o:
// 15 requests * (600 in, 200 out) = 15 * (0.6 * 0.0025 + 0.2 * 0.0100) = 15 * (0.0015 + 0.0020) = 15 * 0.0035 = 0.0525
// cust_17_month_boundary: 1 request on claude-3-5-sonnet:
// 1000 in, 500 out = 0.0030 + 0.0075 = 0.0105
// Remaining for cust_01, 02, 03: 5.869 - 0.0525 - 0.0105 = 5.806
// 23 requests on claude-3-5-sonnet: 5.806 / 23 = ~0.252434
// If claude-3-5-sonnet (0.003/1k in, 0.015/1k out):
// 22 requests with 10,000 in, 14,800 out -> cost = 10*0.003 + 14.8*0.015 = 0.03 + 0.222 = 0.252 (22 * 0.252 = 5.544)
// 1 request with 10,000 in, 16,133.33 output -> let's make exact numbers!

// Let's compute exact integers for tokens to hit 5.869:
// cust_04_highvolume (15 reqs):
// req 1 at boundary: 2026-09-01T00:00:00Z
addRow('cust_04_highvolume', '2026-09-01T00:00:00Z', 'gpt-4o', 1000, 500); // 1*0.0025 + 0.5*0.01 = 0.0075
for (let i = 2; i <= 15; i++) {
  const day = String(i).padStart(2, '0');
  addRow('cust_04_highvolume', `2026-09-${day}T10:00:00Z`, 'gpt-4o', 1000, 500); // 0.0075 each
}
// 15 * 0.0075 = 0.1125

// cust_17_month_boundary: 1 request
addRow('cust_17_month_boundary', '2026-09-15T12:00:00Z', 'gpt-4o', 2000, 500); // 2*0.0025 + 0.5*0.01 = 0.0100
// Cost so far: 0.1125 + 0.0100 = 0.1225
// Need 5.869 - 0.1225 = 5.7465 from 23 requests.
// 5.7465 / 23 = 0.2498478...
// Let's use claude-3-5-sonnet (0.003 in / 0.015 out per 1k):
// cost = (in * 0.003 + out * 0.015) / 1000 = (in*1 + out*5) * 0.000003
// We want 23 requests sum cost = 5.7465
// 5.7465 / 0.000003 = 1,915,500 = in + 5 * out
// 22 requests with in = 10,000, out = 14,600 -> in + 5*out = 10,000 + 73,000 = 83,000
// 22 * 83,000 = 1,826,000
// 23rd request: in + 5*out = 1,915,500 - 1,826,000 = 89,500
// with in = 9,500, out = 16,000 -> 9,500 + 80,000 = 89,500!
// 83,000 * 0.000003 = 0.249
// 22 * 0.249 = 5.478
// 89,500 * 0.000003 = 0.2685
// 5.478 + 0.2685 = 5.7465!
// Total cost = 0.1225 + 5.7465 = 5.869000 EXACTLY!

// cust_01: 8 requests (8 of the 22)
for (let i = 1; i <= 8; i++) {
  addRow('cust_01', `2026-09-${String(i + 5).padStart(2, '0')}T14:00:00Z`, 'claude-3-5-sonnet', 10000, 14600);
}
// cust_02: 8 requests (8 of the 22)
for (let i = 1; i <= 8; i++) {
  addRow('cust_02', `2026-09-${String(i + 10).padStart(2, '0')}T15:00:00Z`, 'claude-3-5-sonnet', 10000, 14600);
}
// cust_03: 7 requests (6 of the 22 + 1 special)
for (let i = 1; i <= 6; i++) {
  addRow('cust_03', `2026-09-${String(i + 15).padStart(2, '0')}T16:00:00Z`, 'claude-3-5-sonnet', 10000, 14600);
}
addRow('cust_03', '2026-09-28T16:00:00Z', 'claude-3-5-sonnet', 9500, 16000);

// September verification:
// 15 (cust_04) + 1 (cust_17) + 8 (cust_01) + 8 (cust_02) + 7 (cust_03) = 39 requests
// Cost = 5.869 exactly. Active customers = 5.

// 3. October 2026:
// 15 active customers:
// cust_04_highvolume has 15 requests
// cust_17_month_boundary has 1 request (6000 in, 1200 out) at 2026-10-01T00:30:00Z
// 13 other active customers (cust_01, 02, 03, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14)
// Total active customers = 1 + 1 + 13 = 15.

for (let i = 1; i <= 15; i++) {
  addRow('cust_04_highvolume', `2026-10-${String(i).padStart(2, '0')}T09:00:00Z`, 'gpt-4o-mini', 2000, 500);
}
addRow('cust_17_month_boundary', '2026-10-01T00:30:00Z', 'gpt-4o', 6000, 1200);

const other13 = ['cust_01', 'cust_02', 'cust_03', 'cust_05', 'cust_06', 'cust_07', 'cust_08', 'cust_09', 'cust_10', 'cust_11', 'cust_12', 'cust_13', 'cust_14'];
for (const cid of other13) {
  addRow(cid, '2026-10-15T12:00:00Z', 'gpt-4o-mini', 1000, 200);
}

// 4. Inactive / other customers across all time:
// Total accounts across all time must be 18:
// The 15 active in Oct: cust_04_highvolume, cust_17_month_boundary, and other13 (which includes cust_01, 02, 03, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14) -> 15 accounts.
// Plus cust_16_august_only (active only in Aug) -> 16th account.
// Plus cust_15 and cust_18: let's add them to November 2026 (or untimestamped/Nov) so total unique accounts is 18!
addRow('cust_15', '2026-11-01T10:00:00Z', 'gpt-4o-mini', 500, 100);
addRow('cust_18', '2026-11-02T10:00:00Z', 'gpt-4o-mini', 500, 100);

// Regression baseline extension:
// 44 priced October requests add exactly $9.97159 at the Gemini 2.5 Flash output rate.
const octoberCustomers = [
  'cust_01', 'cust_02', 'cust_03', 'cust_05', 'cust_06', 'cust_07', 'cust_08',
  'cust_09', 'cust_10', 'cust_11', 'cust_12', 'cust_13', 'cust_14'
];
for (let i = 0; i < 44; i++) {
  const day = 16 + Math.floor(i / octoberCustomers.length);
  const customerId = octoberCustomers[i % octoberCustomers.length];
  const outputTokens = i === 43 ? 90686 : 90650;
  addRow(customerId, `2026-10-${String(day).padStart(2, '0')}T13:00:00Z`, 'gemini-2.5-flash', 0, outputTokens);
}

// Five October records remain unpriced and are excluded from cost totals.
for (let i = 0; i < 5; i++) {
  addRow(octoberCustomers[i], `2026-10-20T${String(10 + i).padStart(2, '0')}:00:00Z`, 'stress-unpriced-model', 1000, 500);
}

// Four November requests add exactly $0.02998 without changing earlier monthly totals.
for (let i = 0; i < 3; i++) {
  addRow(octoberCustomers[i], `2026-11-03T${String(10 + i).padStart(2, '0')}:00:00Z`, 'gpt-4o', 1000, 500);
}
addRow(octoberCustomers[3], '2026-11-04T10:00:00Z', 'gpt-4o', 0, 748);

// Generate CSV
const headers = 'customer_id,timestamp,model_name,input_tokens,output_tokens\n';
const csvContent = headers + rows.map(r => `${r.customer_id},${r.timestamp},${r.model_name},${r.input_tokens},${r.output_tokens}`).join('\n') + '\n';

if (rows.length !== 126) {
  throw new Error(`Stress fixture must contain 126 data rows, got ${rows.length}.`);
}

fs.writeFileSync(path.resolve('data/marginly_stress_test.csv'), csvContent);
fs.writeFileSync(path.resolve('marginly_stress_test.csv'), csvContent);
console.log(`Generated stress test CSV with ${rows.length} rows and ${new Set(rows.map(r => r.customer_id)).size} unique customers.`);
