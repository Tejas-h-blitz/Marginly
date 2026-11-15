import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';
if (!process.env.MARGINLY_TEST_PGLITE_DIR) {
  throw new Error('MARGINLY_TEST_PGLITE_DIR must point to an isolated database copy.');
}

const { checkConnection, db } = await import('./server/dist/db.js');
const {
  clearAllData,
  getCustomersBreakdown,
  getOverallSummary,
  importCustomerRevenue,
  processRawRecords,
  saveRecords,
  updateCustomerRevenue
} = await import('./server/dist/services/usageService.js');

const userId = `revenue_history_test_${Date.now()}`;
const otherUserId = `${userId}_other`;

try {
  await checkConnection();
  const records = await processRawRecords([
    {
      customer_id: 'revenue-customer',
      timestamp: '2026-09-10T00:00:00Z',
      model_name: 'gpt-4o',
      input_tokens: 1000,
      output_tokens: 100
    },
    {
      customer_id: 'revenue-customer',
      timestamp: '2026-10-10T00:00:00Z',
      model_name: 'gpt-4o',
      input_tokens: 2000,
      output_tokens: 100
    },
    {
      customer_id: 'revenue-import-customer',
      timestamp: '2026-09-11T00:00:00Z',
      model_name: 'gpt-4o',
      input_tokens: 1000,
      output_tokens: 100
    },
    {
      customer_id: 'revenue-import-customer',
      timestamp: '2026-10-11T00:00:00Z',
      model_name: 'gpt-4o',
      input_tokens: 1000,
      output_tokens: 100
    },
    {
      customer_id: 'revenue-import-customer',
      timestamp: '2026-11-11T00:00:00Z',
      model_name: 'gpt-4o',
      input_tokens: 1000,
      output_tokens: 100
    }
  ]);
  await saveRecords(records, userId);

  await updateCustomerRevenue(userId, 'revenue-customer', '2026-09', '100');
  await updateCustomerRevenue(userId, 'revenue-customer', '2026-10', '250');
  const september = await getCustomersBreakdown(userId, '2026-09');
  const october = await getCustomersBreakdown(userId, '2026-10');
  assert.equal(Number(september.find(row => row.customerId === 'revenue-customer')?.monthlyRevenueUsd), 100);
  assert.equal(Number(october.find(row => row.customerId === 'revenue-customer')?.monthlyRevenueUsd), 250);

  await updateCustomerRevenue(userId, 'revenue-customer', '2026-10', '275');
  const octoberSummary = await getOverallSummary(userId, '2026-10');
  assert.equal(Number(octoberSummary.totalRevenueUsd), 275);
  assert.ok(octoberSummary.totalMarginUsd !== null);
  assert.equal(Number((await getCustomersBreakdown(userId, '2026-09'))
    .find(row => row.customerId === 'revenue-customer')?.monthlyRevenueUsd), 100);

  await importCustomerRevenue(userId, [
    { customerId: 'revenue-import-customer', monthlyRevenueUsd: '80', effectiveMonth: '2026-08' },
    { customerId: 'revenue-import-customer', monthlyRevenueUsd: '120', effectiveMonth: '2026-10' }
  ]);
  assert.equal(Number((await getCustomersBreakdown(userId, '2026-09'))
    .find(row => row.customerId === 'revenue-import-customer')?.monthlyRevenueUsd), 80);
  assert.equal(Number((await getCustomersBreakdown(userId, '2026-10'))
    .find(row => row.customerId === 'revenue-import-customer')?.monthlyRevenueUsd), 120);
  assert.equal(Number((await getOverallSummary(userId, '2026-10')).totalRevenueUsd), 395);

  await assert.rejects(importCustomerRevenue(userId, [
    { customerId: 'revenue-import-customer', monthlyRevenueUsd: '999', effectiveMonth: '2026-11' },
    { customerId: 'not-owned-by-user', monthlyRevenueUsd: '999', effectiveMonth: '2026-11' }
  ]), /Unknown customer IDs/);
  assert.equal(Number((await getCustomersBreakdown(userId, '2026-11'))
    .find(row => row.customerId === 'revenue-import-customer')?.monthlyRevenueUsd), 120);
  assert.equal((await getCustomersBreakdown(otherUserId, '2026-10')).length, 0);

  await updateCustomerRevenue(userId, 'revenue-customer', '2026-11', null);
  assert.equal((await getCustomersBreakdown(userId, 'all'))
    .find(row => row.customerId === 'revenue-customer')?.monthlyRevenueUsd, null);
  assert.equal(Number((await getCustomersBreakdown(userId, '2026-10'))
    .find(row => row.customerId === 'revenue-customer')?.monthlyRevenueUsd), 275);

  console.log('PASS revenue changes are effective-month scoped and preserve earlier months');
  console.log('PASS summaries calculate margins from the selected month revenue');
  console.log('PASS revenue CSV imports can carry multiple monthly versions atomically');
  console.log('PASS unknown customer revenue rows reject the entire batch');
  console.log('PASS revenue versions are isolated by user and allow explicit clearing');
} finally {
  await clearAllData(userId);
  await clearAllData(otherUserId);
  await db.$disconnect();
}
