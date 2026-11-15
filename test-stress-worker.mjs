import fs from 'fs';
import path from 'path';
import {
  parseCsv,
  processRawRecords,
  saveRecords,
  getOverallSummary,
  getCustomersBreakdown,
  clearAllData
} from './server/dist/services/usageService.js';
import { checkConnection } from './server/dist/db.js';
import { ensurePricingSeeded } from './server/dist/services/pricingService.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ${GREEN}✓${RESET} ${message}${detail ? ` (${CYAN}${detail}${RESET})` : ''}`);
  } else {
    failed++;
    console.error(`  ${RED}✗ FAIL:${RESET} ${message}${detail ? ` (${RED}${detail}${RESET})` : ''}`);
  }
}

async function run() {
  const tz = process.env.TZ || 'System Default';
  console.log(`\n${BOLD}====================================================${RESET}`);
  console.log(`${BOLD}Running Stress & UTC Bucketing Tests in TZ=${CYAN}${tz}${RESET}`);
  console.log(`${BOLD}====================================================${RESET}\n`);

  await checkConnection();
  await ensurePricingSeeded();
  const userId = `stress_test_user_${Date.now()}`;

  // Step 1: Clean slate
  await clearAllData(userId);

  // Step 2: Load stress test CSV fixture
  const csvPath = path.resolve('data/marginly_stress_test.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rawRows = parseCsv(csvContent);
  const processed = await processRawRecords(rawRows);
  await saveRecords(processed, userId);
  console.log(`Loaded ${processed.length} records into test database for user ${userId}.\n`);

  // Step 3: Boundary tests
  console.log(`${BOLD}--- Boundary Tests ---${RESET}`);
  const sepBoundaryRecord = processed.find(r => r.customerId === 'cust_04_highvolume' && r.timestamp?.toISOString() === '2026-09-01T00:00:00.000Z');
  assert(Boolean(sepBoundaryRecord), 'Record at 2026-09-01T00:00:00Z exists in parsed dataset');
  assert(sepBoundaryRecord?.timestamp?.toISOString().slice(0, 7) === '2026-09',
    'Record at exactly 2026-09-01T00:00:00Z is in September',
    sepBoundaryRecord?.timestamp?.toISOString());

  const augBoundaryRecord = processed.find(r => r.customerId === 'cust_16_august_only' && r.timestamp?.toISOString() === '2026-08-31T23:59:59.000Z');
  assert(Boolean(augBoundaryRecord), 'Record at 2026-08-31T23:59:59Z exists in parsed dataset');
  assert(augBoundaryRecord?.timestamp?.toISOString().slice(0, 7) === '2026-08',
    'Record at exactly 2026-08-31T23:59:59Z is in August',
    augBoundaryRecord?.timestamp?.toISOString());

  // Step 4: 2026-08 assertions
  console.log(`\n${BOLD}--- 2026-08 Period Assertions ---${RESET}`);
  const summaryAug = await getOverallSummary(userId, '2026-08');
  const customersAug = await getCustomersBreakdown(userId, '2026-08');

  assert(summaryAug.totalCustomers === 1, '2026-08 active customer count is 1', `totalCustomers: ${summaryAug.totalCustomers}`);
  assert(customersAug.length === 1, '2026-08 customer breakdown length is 1', `length: ${customersAug.length}`);
  assert(customersAug[0]?.customerId === 'cust_16_august_only', '2026-08 active customer is cust_16_august_only', customersAug[0]?.customerId);
  assert(!customersAug.some(c => c.customerId === 'cust_04_highvolume'), 'cust_04_highvolume must not appear in 2026-08');
  assert(summaryAug.totalRequests === 3, '2026-08 total requests is 3', `requests: ${summaryAug.totalRequests}`);
  assert(summaryAug.totalInputTokens === 24000, '2026-08 total input tokens is 24,000', `inputTokens: ${summaryAug.totalInputTokens}`);
  assert(summaryAug.totalOutputTokens === 4500, '2026-08 total output tokens is 4,500', `outputTokens: ${summaryAug.totalOutputTokens}`);
  assert(summaryAug.totalCost === '0.01845', '2026-08 total cost is 0.01845', `totalCost: $${summaryAug.totalCost}`);

  // Step 5: 2026-09 assertions
  console.log(`\n${BOLD}--- 2026-09 Period Assertions ---${RESET}`);
  const summarySep = await getOverallSummary(userId, '2026-09');
  const customersSep = await getCustomersBreakdown(userId, '2026-09');

  assert(summarySep.totalCustomers === 5, '2026-09 active customer count is 5', `totalCustomers: ${summarySep.totalCustomers}`);
  assert(customersSep.length === 5, '2026-09 customer breakdown length is 5', `length: ${customersSep.length}`);
  const activeIdsSep = new Set(customersSep.map(c => c.customerId));
  const expectedSepIds = ['cust_01', 'cust_02', 'cust_03', 'cust_04_highvolume', 'cust_17_month_boundary'];
  assert(expectedSepIds.every(id => activeIdsSep.has(id)), '2026-09 contains all 5 expected active customers (01, 02, 03, 04, 17)', Array.from(activeIdsSep).sort().join(', '));
  assert(summarySep.totalRequests === 39, '2026-09 total requests is 39', `requests: ${summarySep.totalRequests}`);
  const sepCostNum = parseFloat(summarySep.totalCost);
  assert(Math.abs(sepCostNum - 5.869) < 0.001, '2026-09 cost is about 5.869', `totalCost: $${summarySep.totalCost}`);
  const cust04Sep = customersSep.find(c => c.customerId === 'cust_04_highvolume');
  assert(cust04Sep?.totalRequests === 15, 'cust_04_highvolume has 15 requests in 2026-09', `requests: ${cust04Sep?.totalRequests}`);
  const cust17Sep = customersSep.find(c => c.customerId === 'cust_17_month_boundary');
  assert(cust17Sep?.totalRequests === 1, 'cust_17_month_boundary has 1 request in 2026-09', `requests: ${cust17Sep?.totalRequests}`);

  // Step 6: 2026-10 assertions
  console.log(`\n${BOLD}--- 2026-10 Period Assertions ---${RESET}`);
  const summaryOct = await getOverallSummary(userId, '2026-10');
  const customersOct = await getCustomersBreakdown(userId, '2026-10');

  assert(summaryOct.totalCustomers === 15, '2026-10 active customer count is 15', `totalCustomers: ${summaryOct.totalCustomers}`);
  assert(customersOct.length === 15, '2026-10 customer breakdown length is 15', `length: ${customersOct.length}`);
  assert(summaryOct.totalRequests === 78, '2026-10 total requests is 78', `requests: ${summaryOct.totalRequests}`);
  assert(summaryOct.pricedRequests === 73, '2026-10 priced requests is 73', `pricedRequests: ${summaryOct.pricedRequests}`);
  assert(summaryOct.unpricedModels.reduce((sum, model) => sum + model.requestCount, 0) === 5,
    '2026-10 unpriced requests is 5',
    `unpricedRequests: ${summaryOct.unpricedModels.reduce((sum, model) => sum + model.requestCount, 0)}`);
  assert(Math.abs(Number(summaryOct.totalCost) - 10.0111) < 0.000001,
    '2026-10 cost is 10.0111',
    `totalCost: $${summaryOct.totalCost}`);
  const cust04Oct = customersOct.find(c => c.customerId === 'cust_04_highvolume');
  assert(cust04Oct?.totalRequests === 15, 'cust_04_highvolume has 15 requests in 2026-10', `requests: ${cust04Oct?.totalRequests}`);
  const cust17Oct = customersOct.find(c => c.customerId === 'cust_17_month_boundary');
  assert(cust17Oct?.totalRequests === 1, 'cust_17_month_boundary has 1 request in 2026-10', `requests: ${cust17Oct?.totalRequests}`);
  assert(cust17Oct?.totalInputTokens === 6000, 'cust_17_month_boundary has 6,000 input tokens in 2026-10', `inputTokens: ${cust17Oct?.totalInputTokens}`);
  assert(cust17Oct?.totalOutputTokens === 1200, 'cust_17_month_boundary has 1,200 output tokens in 2026-10', `outputTokens: ${cust17Oct?.totalOutputTokens}`);

  // Step 7: All time assertions
  console.log(`\n${BOLD}--- All Time Assertions ---${RESET}`);
  const summaryAll = await getOverallSummary(userId, 'all');
  const customersAll = await getCustomersBreakdown(userId, 'all');
  assert(summaryAll.totalCustomers === 18, 'All-time view shows all 18 customers', `totalCustomers: ${summaryAll.totalCustomers}`);
  assert(customersAll.length === 18, 'All-time customer breakdown has 18 rows', `rows: ${customersAll.length}`);
  assert(summaryAll.totalRequests === 126, 'All-time requests is 126', `requests: ${summaryAll.totalRequests}`);
  assert(summaryAll.pricedRequests === 121, 'All-time priced requests is 121', `pricedRequests: ${summaryAll.pricedRequests}`);
  assert(summaryAll.unpricedModels.reduce((sum, model) => sum + model.requestCount, 0) === 5,
    'All-time unpriced requests is 5',
    `unpricedRequests: ${summaryAll.unpricedModels.reduce((sum, model) => sum + model.requestCount, 0)}`);
  assert(Math.abs(Number(summaryAll.totalCost) - 15.9288) < 0.000001,
    'All-time cost is 15.9288',
    `totalCost: $${summaryAll.totalCost}`);

  // Cleanup
  await clearAllData(userId);

  console.log(`\n${BOLD}Test Summary for TZ=${CYAN}${tz}${RESET}: Passed ${GREEN}${passed}${RESET}, Failed ${failed > 0 ? RED : GREEN}${failed}${RESET}`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
