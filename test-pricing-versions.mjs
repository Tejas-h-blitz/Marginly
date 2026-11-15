import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';
if (!process.env.MARGINLY_TEST_PGLITE_DIR) {
  throw new Error('MARGINLY_TEST_PGLITE_DIR must point to an isolated database copy.');
}

const { checkConnection, db } = await import('./server/dist/db.js');
const {
  createCustomRate,
  deleteCustomRate,
  ensurePricingSeeded,
  getActivePricing,
  getUsageCosts,
  PriceVersionConflictError,
  updateCustomRate
} = await import('./server/dist/services/pricingService.js');
const {
  clearAllData,
  getOverallSummary,
  processRawRecords,
  saveRecords
} = await import('./server/dist/services/usageService.js');
const { generateCustomerBreakdownCsv } = await import('./server/dist/services/exportService.js');

const userId = `price_version_test_${Date.now()}`;
const otherUserId = `${userId}_other`;
const customRateIds = [];

try {
  await checkConnection();
  const scheduledModels = await ensurePricingSeeded();
  assert.deepEqual(scheduledModels, ['gemini-3.8-flash', 'gemini-3.6-flash']);

  const records = await processRawRecords([
    {
      customer_id: 'price-version-boundary',
      timestamp: '2026-12-31T23:59:59Z',
      model_name: 'gemini-3.8-flash',
      input_tokens: 10000,
      output_tokens: 2000
    },
    {
      customer_id: 'price-version-boundary',
      timestamp: '2027-01-01T00:00:00Z',
      model_name: 'gemini-3.8-flash',
      input_tokens: 10000,
      output_tokens: 2000
    }
  ]);
  await saveRecords(records, userId);

  const december = await getOverallSummary(userId, '2026-12');
  const january = await getOverallSummary(userId, '2027-01');
  assert.equal(december.totalCost, '0.015');
  assert.equal(january.totalCost, '0.03');

  const pricing = await getActivePricing(userId);
  assert.equal(pricing.models['gemini-3.8-flash'].costPer1kInput, 0.00075);
  assert.equal(pricing.models['gemini-3.8-flash'].costPer1kOutput, 0.00375);
  assert.deepEqual(
    pricing.upcoming.map(rate => rate.modelName).sort(),
    ['gemini-3.6-flash', 'gemini-3.8-flash']
  );
  assert.equal(pricing.custom.length, 0);

  const customRate = await createCustomRate(userId, {
    model_name: 'pricing-test-unknown',
    input_per_million: '5',
    output_per_million: '15',
    effective_from: '2026-01-01'
  });
  customRateIds.push(customRate.id);
  assert.equal(customRate.costPer1kInput, 0.005);
  assert.equal(customRate.costPer1kOutput, 0.015);

  const customUsage = [{
    modelName: 'pricing-test-unknown',
    timestamp: new Date('2026-06-01T00:00:00Z'),
    inputTokens: 1000,
    outputTokens: 2000
  }];
  const customCost = await getUsageCosts(userId, customUsage);
  assert.equal(Number(customCost[0].cost), 0.035);
  const isolatedCost = await getUsageCosts(otherUserId, customUsage);
  assert.equal(isolatedCost[0].cost, null);
  assert.equal((await getActivePricing(otherUserId)).custom.length, 0);
  assert.equal(await updateCustomRate(otherUserId, customRate.id, {
    model_name: 'pricing-test-unknown',
    input_per_million: '5',
    output_per_million: '15',
    effective_from: '2026-01-01'
  }), null);
  assert.equal(await deleteCustomRate(otherUserId, customRate.id), false);

  const catalogOverride = await createCustomRate(userId, {
    model_name: 'gemini-3.8-flash',
    input_per_million: '4',
    output_per_million: '6',
    effective_from: ''
  });
  customRateIds.push(catalogOverride.id);
  const userPricing = await getActivePricing(userId);
  assert.equal(userPricing.models['gemini-3.8-flash'].costPer1kInput, 0.004);
  assert.equal(userPricing.models['gemini-3.8-flash'].costPer1kOutput, 0.006);

  await assert.rejects(
    createCustomRate(userId, {
      model_name: 'pricing-test-unknown',
      input_per_million: '5',
      output_per_million: '15',
      effective_from: '2026-01-01'
    }),
    PriceVersionConflictError
  );

  await updateCustomRate(userId, customRate.id, {
    model_name: 'pricing-test-unknown',
    input_per_million: '10',
    output_per_million: '20',
    effective_from: '2026-01-01'
  });
  const recalculatedCost = await getUsageCosts(userId, customUsage);
  assert.equal(Number(recalculatedCost[0].cost), 0.05);

  const csv = generateCustomerBreakdownCsv([{
    customerId: 'csv-cost-basis-test',
    totalRequests: 1,
    pricedRequests: 1,
    totalInputTokens: 1000,
    totalOutputTokens: 2000,
    totalTokens: 3000,
    monthlyRevenueUsd: null,
    totalCost: '0.05',
    marginUsd: null,
    marginPercent: null,
    avgCostPerRequest: '0.05',
    percentOfTotal: '100'
  }]);
  assert.ok(csv.split('\n')[0].split(',').includes('cost_basis'));
  assert.ok(csv.includes('"effective rate at usage timestamp; current rate for untimestamped records"'));

  console.log('PASS price-version boundary: 2026-12-31T23:59:59Z = $0.015');
  console.log('PASS price-version boundary: 2027-01-01T00:00:00Z = $0.030');
  console.log(`PASS scheduled global versions for catalog models: ${scheduledModels.join(', ')}`);
  console.log('PASS custom rates: exact conversion, active catalog override, user isolation, conflict handling, query-time recalculation');
  console.log('PASS CSV export records the effective-rate cost basis');
} finally {
  for (const id of customRateIds) await deleteCustomRate(userId, id);
  await clearAllData(userId);
  await db.$disconnect();
}
