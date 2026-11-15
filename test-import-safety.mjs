import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(new URL('./server/package.json', import.meta.url));
const express = require('express');

process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';
process.env.TEST_AUTH_SECRET = 'marginly_import_test_secret_2026';
if (!process.env.MARGINLY_TEST_PGLITE_DIR) {
  throw new Error('MARGINLY_TEST_PGLITE_DIR must point to an isolated database copy.');
}

const { apiRouter, getAuthenticatedUserId } = await import('./server/dist/routes/api.js');
const { checkConnection, db } = await import('./server/dist/db.js');
const { ensurePricingSeeded } = await import('./server/dist/services/pricingService.js');
const {
  clearAllData,
  processRawRecords,
  saveImportedRecords
} = await import('./server/dist/services/usageService.js');
const secret = process.env.TEST_AUTH_SECRET;

function createToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

const userId = `import_test_${Date.now()}`;
const otherUserId = `${userId}_other`;
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRouter);
app.use((error, req, res, next) => {
  if ((req.path === '/api' || req.path.startsWith('/api/')) && !getAuthenticatedUserId(req)) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (error.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request data must be 10 MB or smaller.' });
    return;
  }
  if (error.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Request body contains invalid JSON.' });
    return;
  }
  next(error);
});
const server = createServer(app);

try {
  await checkConnection();
  await ensurePricingSeeded();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    Authorization: `Bearer ${createToken(userId)}`,
    'Content-Type': 'application/json'
  };
  const rows = [
    'customer_id,timestamp,model_name,input_tokens,output_tokens',
    'customer-A,2026-10-04T10:00:00Z,gpt-4o,1000,1000',
    'customer-A,2026-10-04T10:01:00Z,unlisted-model-xyz,200,300',
    'customer-A,2026-10-04T10:01:00Z,unlisted-model-xyz,200,300'
  ].join('\n');

  const unauthenticatedApiRequests = [
    ['GET', '/api/summary?month=all'],
    ['GET', '/api/customers?month=all'],
    ['GET', '/api/customers/customer-A/detail?month=all'],
    ['PUT', '/api/customers/customer-A/revenue'],
    ['POST', '/api/revenue/import'],
    ['GET', '/api/pricing'],
    ['POST', '/api/upload'],
    ['POST', '/api/paste'],
    ['POST', '/api/load-sample'],
    ['POST', '/api/clear'],
    ['GET', '/api/export'],
    ['GET', '/api/import-history'],
    ['POST', '/api/import-history/test-batch/undo'],
    ['POST', '/api/custom-rates'],
    ['PUT', '/api/custom-rates'],
    ['DELETE', '/api/custom-rates'],
    ['POST', '/api/customers/merge']
  ];
  for (const [method, path] of unauthenticatedApiRequests) {
    const response = await fetch(`${baseUrl}${path}`, { method });
    console.log(`[AUTH] ${method} ${path} -> ${response.status}`);
    assert.equal(response.status, 401, `${method} ${path} must require authentication`);
  }

  const unauthenticatedOversized = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'x'.repeat(10 * 1024 * 1024 + 1), format: 'csv' })
  });
  assert.equal(unauthenticatedOversized.status, 401);

  const unauthenticatedMalformed = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"content":'
  });
  assert.equal(unauthenticatedMalformed.status, 401);

  const authenticatedMalformed = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: '{"content":'
  });
  assert.equal(authenticatedMalformed.status, 400);

  const firstResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: rows, format: 'csv' })
  });
  assert.equal(firstResponse.status, 409);
  const firstPreview = await firstResponse.json();
  assert.equal(firstPreview.code, 'DUPLICATES');
  assert.equal(firstPreview.withinFile, 1);
  assert.equal((await (await fetch(`${baseUrl}/api/summary?month=all`, {
    headers: { Authorization: headers.Authorization }
  })).json()).totalRequests, 0);

  const firstSkipResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: rows, format: 'csv', duplicate_mode: 'skip' })
  });
  assert.equal(firstSkipResponse.status, 200);
  const first = await firstSkipResponse.json();
  assert.equal(first.insertedRecords, 2);
  assert.equal(first.duplicateRecords, 1);
  assert.equal(first.withinFileDuplicates, 1);
  assert.equal(first.unpricedRecords, 1);

  const repeatedResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: rows, format: 'csv' })
  });
  assert.equal(repeatedResponse.status, 409);
  const repeatedPreview = await repeatedResponse.json();
  assert.equal(repeatedPreview.existing, 2);
  assert.equal(repeatedPreview.withinFile, 1);

  const repeatedSkipResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: rows, format: 'csv', duplicate_mode: 'skip' })
  });
  assert.equal(repeatedSkipResponse.status, 200);
  const repeated = await repeatedSkipResponse.json();
  assert.equal(repeated.insertedRecords, 0);
  assert.equal(repeated.duplicateRecords, 3);

  const allowedResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: rows, format: 'csv', duplicate_mode: 'allow' })
  });
  assert.equal(allowedResponse.status, 200);
  const allowed = await allowedResponse.json();
  assert.equal(allowed.insertedRecords, 3);
  assert.equal(allowed.duplicateRecords, 3);
  assert.equal(allowed.batch.duplicateMode, 'allow');

  const otherSameFileResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${createToken(otherUserId)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: rows, format: 'csv', duplicate_mode: 'skip' })
  });
  assert.equal(otherSameFileResponse.status, 200);
  const otherSameFile = await otherSameFileResponse.json();
  assert.equal(otherSameFile.insertedRecords, 2);
  assert.equal(otherSameFile.duplicateRecords, 1);
  const otherHeaders = {
    Authorization: `Bearer ${createToken(otherUserId)}`,
    'Content-Type': 'application/json'
  };

  const aOnlyResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: 'customer_id,timestamp,model_name,input_tokens,output_tokens\ncustomer-only-A,2026-10-04T10:02:00Z,gpt-4o,100,100',
      format: 'csv'
    })
  });
  assert.equal(aOnlyResponse.status, 200);
  const otherCustomersResponse = await fetch(`${baseUrl}/api/customers?month=all`, {
    headers: { Authorization: otherHeaders.Authorization }
  });
  const otherCustomers = await otherCustomersResponse.json();
  assert.equal(otherCustomers.some(customer => customer.customerId === 'customer-only-A'), false);
  const otherSummaryBeforeAUndo = await fetch(`${baseUrl}/api/summary?month=all`, {
    headers: { Authorization: otherHeaders.Authorization }
  });
  assert.equal((await otherSummaryBeforeAUndo.json()).totalRequests, 2);
  const otherDetailResponse = await fetch(`${baseUrl}/api/customers/customer-only-A/detail?month=all`, {
    headers: { Authorization: otherHeaders.Authorization }
  });
  assert.equal(otherDetailResponse.status, 404);
  const otherExport = await fetch(`${baseUrl}/api/export?month=all`, {
    headers: { Authorization: otherHeaders.Authorization }
  });
  assert.equal((await otherExport.text()).includes('customer-only-A'), false);

  const aRevenueUpdate = await fetch(`${baseUrl}/api/customers/customer-A/revenue`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ monthly_revenue_usd: '123', effective_month: '2026-10' })
  });
  assert.equal(aRevenueUpdate.status, 200);
  const bRevenueUpdate = await fetch(`${baseUrl}/api/customers/customer-A/revenue`, {
    method: 'PUT',
    headers: otherHeaders,
    body: JSON.stringify({ monthly_revenue_usd: '456', effective_month: '2026-10' })
  });
  assert.equal(bRevenueUpdate.status, 200);
  const aRevenueAfterBEdit = await fetch(`${baseUrl}/api/customers?month=2026-10`, {
    headers: { Authorization: headers.Authorization }
  });
  assert.equal(
    Number((await aRevenueAfterBEdit.json()).find(customer => customer.customerId === 'customer-A').monthlyRevenueUsd),
    123
  );

  const forbiddenUndo = await fetch(`${baseUrl}/api/import-history/${allowed.batch.id}/undo`, {
    method: 'POST',
    headers: { Authorization: otherHeaders.Authorization }
  });
  assert.equal(forbiddenUndo.status, 404);
  assert.equal((await (await fetch(`${baseUrl}/api/summary?month=all`, {
    headers: { Authorization: headers.Authorization }
  })).json()).totalRequests, 6);

  const undoAllowed = await fetch(`${baseUrl}/api/import-history/${allowed.batch.id}/undo`, {
    method: 'POST',
    headers: { Authorization: headers.Authorization }
  });
  assert.equal(undoAllowed.status, 200);
  assert.equal((await undoAllowed.json()).removedRecords, 3);
  assert.equal((await (await fetch(`${baseUrl}/api/summary?month=all`, {
    headers: { Authorization: headers.Authorization }
  })).json()).totalRequests, 3);

  const historyResponse = await fetch(`${baseUrl}/api/import-history`, {
    headers: { Authorization: headers.Authorization }
  });
  assert.equal(historyResponse.status, 200);
  const history = await historyResponse.json();
  assert.equal(history.length, 3);
  assert.equal(history.every(item => item.sourceType === 'paste'), true);
  assert.equal(history.some(item => item.totalRecords === 3 && item.withinFileDuplicates === 1), true);
  assert.equal(history.some(item => item.insertedRecords === 2 && item.unpricedRecords === 1), true);

  const otherHistoryResponse = await fetch(`${baseUrl}/api/import-history`, {
    headers: { Authorization: otherHeaders.Authorization }
  });
  const otherHistory = await otherHistoryResponse.json();
  assert.equal(otherHistory.length, 1);
  assert.equal(otherHistory[0].insertedRecords, 2);

  const invalidResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: 'customer_id,model_name,input_tokens,output_tokens\ncustomer-B,gpt-4o,1.5,2',
      format: 'csv'
    })
  });
  assert.equal(invalidResponse.status, 400);
  const invalid = await invalidResponse.json();
  assert.match(invalid.rejectedRows[0], /token counts/);

  const missingRequiredField = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: 'customer_id,model_name,input_tokens,output_tokens\ncustomer-B,gpt-4o,100,',
      format: 'csv'
    })
  });
  assert.equal(missingRequiredField.status, 400);
  assert.match((await missingRequiredField.json()).rejectedRows[0], /input_tokens and output_tokens are required/);

  const missingModelName = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: 'customer_id,model_name,input_tokens,output_tokens\ncustomer-B,,100,200',
      format: 'csv'
    })
  });
  assert.equal(missingModelName.status, 400);
  assert.match((await missingModelName.json()).rejectedRows[0], /model_name is required/);

  const oversizedContent = 'x'.repeat(10 * 1024 * 1024 + 1);
  const oversizedResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: oversizedContent, format: 'csv' })
  });
  assert.equal(oversizedResponse.status, 413);

  const uploadForm = new FormData();
  uploadForm.append(
    'file',
    new Blob(['x'.repeat(10 * 1024 * 1024 + 1)], { type: 'text/csv' }),
    'too-large.csv'
  );
  const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: { Authorization: headers.Authorization },
    body: uploadForm
  });
  assert.equal(uploadResponse.status, 413);

  const summaryResponse = await fetch(`${baseUrl}/api/summary?month=all`, {
    headers: { Authorization: headers.Authorization }
  });
  assert.equal((await summaryResponse.json()).totalRequests, 3);
  const baselineCustomersResponse = await fetch(`${baseUrl}/api/customers?month=all`, {
    headers: { Authorization: headers.Authorization }
  });
  const baselineCustomerIds = (await baselineCustomersResponse.json()).map(customer => customer.customerId);

  const sampleLoadResponse = await fetch(`${baseUrl}/api/load-sample`, {
    method: 'POST',
    headers: { Authorization: headers.Authorization }
  });
  assert.equal(sampleLoadResponse.status, 200);
  const sampleLoad = await sampleLoadResponse.json();
  assert.ok(sampleLoad.insertedRecords > 0);
  const sampleCustomersResponse = await fetch(`${baseUrl}/api/customers?month=all`, {
    headers: { Authorization: headers.Authorization }
  });
  const sampleCustomerIds = (await sampleCustomersResponse.json()).map(customer => customer.customerId);
  assert.ok(sampleCustomerIds.length > 0);
  const realImportResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: 'customer_id,timestamp,model_name,input_tokens,output_tokens\nreal-import-customer,2026-10-04T10:03:00Z,gpt-4o,100,100',
      format: 'csv'
    })
  });
  assert.equal(realImportResponse.status, 200);
  const realImport = await realImportResponse.json();
  assert.equal(realImport.sampleDataRemoved, true);
  assert.match(realImport.message, /Previous sample data and its customers were removed/);
  const customersAfterRealImportResponse = await fetch(`${baseUrl}/api/customers?month=all`, {
    headers: { Authorization: headers.Authorization }
  });
  const customersAfterRealImport = await customersAfterRealImportResponse.json();
  const sampleOnlyCustomerIds = sampleCustomerIds.filter(id => !baselineCustomerIds.includes(id));
  assert.ok(sampleOnlyCustomerIds.length > 0);
  assert.equal(sampleOnlyCustomerIds.some(id => customersAfterRealImport.some(customer => customer.customerId === id)), false);
  assert.equal((await (await fetch(`${baseUrl}/api/import-history`, {
    headers: { Authorization: headers.Authorization }
  })).json()).some(batch => batch.sourceType === 'sample'), false);

  const aliasResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: 'customerid,engine,tokens_in,tokens_out\ncustomer-alias,gpt-4o,100,20',
      format: 'csv'
    })
  });
  assert.equal(aliasResponse.status, 200);
  assert.equal((await aliasResponse.json()).insertedRecords, 1);

  const revenueCsv = new FormData();
  revenueCsv.append(
    'file',
    new Blob([
      'customer_id,effective_month,monthly_revenue_usd\n' +
      'customer-A,2026-10,250.00\n' +
      'customer-A,2026-11,300.00\n'
    ], { type: 'text/csv' }),
    'revenue.csv'
  );
  const revenueImport = await fetch(`${baseUrl}/api/revenue/import`, {
    method: 'POST',
    headers: { Authorization: headers.Authorization },
    body: revenueCsv
  });
  assert.equal(revenueImport.status, 200);
  assert.equal((await revenueImport.json()).importedCustomers, 2);

  const octoberCustomers = await fetch(`${baseUrl}/api/customers?month=2026-10`, {
    headers: { Authorization: headers.Authorization }
  });
  const octoberCustomer = (await octoberCustomers.json())
    .find(customer => customer.customerId === 'customer-A');
  assert.equal(Number(octoberCustomer.monthlyRevenueUsd), 250);

  const unknownRevenueCsv = new FormData();
  unknownRevenueCsv.append(
    'file',
    new Blob([
      'customer_id,effective_month,monthly_revenue_usd\n' +
      'customer-A,2026-10,999.00\n' +
      'not-owned,2026-10,100.00\n'
    ], { type: 'text/csv' }),
    'invalid-revenue.csv'
  );
  const rejectedRevenueImport = await fetch(`${baseUrl}/api/revenue/import`, {
    method: 'POST',
    headers: { Authorization: headers.Authorization },
    body: unknownRevenueCsv
  });
  assert.equal(rejectedRevenueImport.status, 404);
  const stillOctoberCustomers = await fetch(`${baseUrl}/api/customers?month=2026-10`, {
    headers: { Authorization: headers.Authorization }
  });
  const stillOctoberCustomer = (await stillOctoberCustomers.json())
    .find(customer => customer.customerId === 'customer-A');
  assert.equal(Number(stillOctoberCustomer.monthlyRevenueUsd), 250);

  const septemberRevenueUpdate = await fetch(`${baseUrl}/api/customers/customer-A/revenue`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ monthly_revenue_usd: '100', effective_month: '2026-09' })
  });
  assert.equal(septemberRevenueUpdate.status, 200);

  const bClearResponse = await fetch(`${baseUrl}/api/clear`, {
    method: 'POST',
    headers: { Authorization: otherHeaders.Authorization }
  });
  assert.equal(bClearResponse.status, 200);
  assert.equal((await (await fetch(`${baseUrl}/api/summary?month=all`, {
    headers: { Authorization: headers.Authorization }
  })).json()).totalRequests, 5);
  const bReimportResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers: otherHeaders,
    body: JSON.stringify({ content: rows, format: 'csv', duplicate_mode: 'skip' })
  });
  assert.equal(bReimportResponse.status, 200);
  assert.equal((await bReimportResponse.json()).insertedRecords, 2);

  const threeDuplicateRowsUser = `${userId}_three`;
  const identicalTimestampedRow = 'same-customer,2026-10-04T10:00:00Z,gpt-4o,100,100';
  const threeDuplicateResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${createToken(threeDuplicateRowsUser)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: `customer_id,timestamp,model_name,input_tokens,output_tokens\n${identicalTimestampedRow}\n${identicalTimestampedRow}\n${identicalTimestampedRow}`,
      format: 'csv'
    })
  });
  assert.equal(threeDuplicateResponse.status, 409);
  assert.equal((await threeDuplicateResponse.json()).withinFile, 2);

  const untimestampedUser = `${userId}_undated`;
  const untimestampedRows = 'customer_id,model_name,input_tokens,output_tokens\nundated-customer,gpt-4o,100,100\nundated-customer,gpt-4o,100,100';
  const undatedHeaders = {
    Authorization: `Bearer ${createToken(untimestampedUser)}`,
    'Content-Type': 'application/json'
  };
  const undatedFirstResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers: undatedHeaders,
    body: JSON.stringify({ content: untimestampedRows, format: 'csv' })
  });
  assert.equal(undatedFirstResponse.status, 200);
  assert.equal((await undatedFirstResponse.json()).withinFileDuplicates, 0);
  const undatedRepeatedResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers: undatedHeaders,
    body: JSON.stringify({ content: untimestampedRows, format: 'csv' })
  });
  assert.equal(undatedRepeatedResponse.status, 200);
  assert.equal((await undatedRepeatedResponse.json()).insertedRecords, 2);

  const atomicUserId = `${userId}_atomic`;
  const suffix = Date.now();
  const functionName = `import_atomic_failure_${suffix}`;
  const triggerName = `import_atomic_failure_${suffix}`;
  let atomicTriggerCreated = false;
  let atomicFunctionCreated = false;
  try {
    await db.$queryRaw(`
      CREATE FUNCTION ${functionName}() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.user_id = '${atomicUserId}' AND NEW.input_tokens = 987654 THEN
          RAISE EXCEPTION 'injected final-chunk import failure';
        END IF;
        RETURN NEW;
      END;
      $$;
    `);
    atomicFunctionCreated = true;
    await db.$queryRaw(
      `CREATE TRIGGER ${triggerName} BEFORE INSERT ON usage_records
       FOR EACH ROW EXECUTE FUNCTION ${functionName}();`
    );
    atomicTriggerCreated = true;
    const atomicRecords = await processRawRecords(Array.from({ length: 1001 }, (_, index) => ({
      customer_id: `atomic-customer-${index}`,
      timestamp: new Date(Date.UTC(2026, 9, 1, 0, index)).toISOString(),
      model_name: 'gpt-4o',
      input_tokens: index === 1000 ? 987654 : 100,
      output_tokens: 100
    })));
    await assert.rejects(saveImportedRecords(atomicRecords, atomicUserId, {
      sourceName: 'atomic-failure.csv',
      sourceType: 'paste',
      duplicateMode: 'skip'
    }), /injected final-chunk import failure/);
    const remainingRows = await db.$queryRaw(
      'SELECT COUNT(*)::integer AS count FROM usage_records WHERE user_id = $1;',
      atomicUserId
    );
    const remainingBatches = await db.$queryRaw(
      'SELECT COUNT(*)::integer AS count FROM import_batches WHERE user_id = $1;',
      atomicUserId
    );
    const remainingCustomers = await db.$queryRaw(
      'SELECT COUNT(*)::integer AS count FROM customers WHERE user_id = $1;',
      atomicUserId
    );
    assert.equal(Number(remainingRows[0].count), 0);
    assert.equal(Number(remainingBatches[0].count), 0);
    assert.equal(Number(remainingCustomers[0].count), 0);
  } finally {
    if (atomicTriggerCreated) await db.$queryRaw(`DROP TRIGGER ${triggerName} ON usage_records;`);
    if (atomicFunctionCreated) await db.$queryRaw(`DROP FUNCTION ${functionName}();`);
  }

  const customRateResponse = await fetch(`${baseUrl}/api/custom-rates`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model_name: 'clear-test-model',
      input_per_million: '1',
      output_per_million: '2',
      effective_from: '2026-01-01'
    })
  });
  assert.equal(customRateResponse.status, 201);
  const otherCustomRateResponse = await fetch(`${baseUrl}/api/custom-rates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${createToken(otherUserId)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model_name: 'other-clear-test-model',
      input_per_million: '1',
      output_per_million: '2',
      effective_from: '2026-01-01'
    })
  });
  assert.equal(otherCustomRateResponse.status, 201);

  const clearResponse = await fetch(`${baseUrl}/api/clear`, {
    method: 'POST',
    headers: { Authorization: headers.Authorization }
  });
  assert.equal(clearResponse.status, 200);
  assert.match((await clearResponse.json()).message, /custom pricing rates were cleared/);
  const clearedHistory = await fetch(`${baseUrl}/api/import-history`, {
    headers: { Authorization: headers.Authorization }
  });
  assert.deepEqual(await clearedHistory.json(), []);
  const clearedPricing = await fetch(`${baseUrl}/api/pricing`, {
    headers: { Authorization: headers.Authorization }
  });
  assert.deepEqual((await clearedPricing.json()).custom, []);
  const otherPricing = await fetch(`${baseUrl}/api/pricing`, {
    headers: { Authorization: otherHeaders.Authorization }
  });
  assert.equal((await otherPricing.json()).custom.length, 1);
  const clearedSummary = await fetch(`${baseUrl}/api/summary?month=all`, {
    headers: { Authorization: headers.Authorization }
  });
  assert.equal((await clearedSummary.json()).totalRequests, 0);
  const otherSummary = await fetch(`${baseUrl}/api/summary?month=all`, {
    headers: { Authorization: `Bearer ${createToken(otherUserId)}` }
  });
  assert.equal((await otherSummary.json()).totalRequests, 2);

  console.log(`PASS all ${unauthenticatedApiRequests.length} API routes reject unauthenticated requests with 401`);
  console.log('PASS parser errors and oversized unauthenticated API requests still return 401');
  console.log('PASS duplicate preview writes nothing; skip, allow, within-file counts, and undo work');
  console.log('PASS timestamped within-file duplicates and untimestamped duplicate exclusions');
  console.log('PASS injected final-chunk failure rolls back the entire import');
  console.log('PASS identical file contents are deduplicated only within the owning user');
  console.log('PASS invalid batches are rejected before writes');
  console.log('PASS required model and token fields reject malformed rows');
  console.log('PASS paste and uploaded files above 10 MB return 413');
  console.log('PASS import records and history remain scoped to their owner');
  console.log('PASS revenue CSV imports and API edits use effective months without partial updates');
  console.log("PASS atomic clear removes only the account owner's usage, revenue, import history, and custom pricing");
} finally {
  await new Promise(resolve => server.close(resolve));
  await clearAllData(userId);
  await clearAllData(otherUserId);
  await clearAllData(`${userId}_three`);
  await clearAllData(`${userId}_undated`);
  await clearAllData(`${userId}_atomic`);
  await db.$disconnect();
}
