import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(new URL('./server/package.json', import.meta.url));
const express = require('express');

process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';
process.env.TEST_AUTH_SECRET = 'marginly_customer_merge_test_secret';
if (!process.env.MARGINLY_TEST_PGLITE_DIR) {
  throw new Error('MARGINLY_TEST_PGLITE_DIR must point to an isolated database copy.');
}

const { apiRouter, getAuthenticatedUserId } = await import('./server/dist/routes/api.js');
const { checkConnection, db } = await import('./server/dist/db.js');
const { ensurePricingSeeded, getUsageCosts } = await import('./server/dist/services/pricingService.js');
const {
  clearAllData,
  getCustomerDetail,
  mergeCustomerInto,
  processRawRecords,
  saveRecords,
  updateCustomerRevenue
} = await import('./server/dist/services/usageService.js');

const userId = `customer_merge_test_${Date.now()}`;
const otherUserId = `${userId}_other`;
const rollbackSuffix = `${Date.now()}`;
const functionName = `merge_rollback_${rollbackSuffix}`;
const triggerName = `merge_rollback_${rollbackSuffix}`;
const sourceId = 'merge-source';
const targetId = 'merge-target';
let rollbackFunctionCreated = false;
let rollbackTriggerCreated = false;

function createToken(id) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: id,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.TEST_AUTH_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

const app = express();
app.use(express.json());
app.use('/api', apiRouter);
app.use((error, req, res, next) => {
  if ((req.path === '/api' || req.path.startsWith('/api/')) && !getAuthenticatedUserId(req)) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next(error);
});
const server = createServer(app);

async function customerRequests(id) {
  const detail = await getCustomerDetail(userId, id, 'all');
  return detail?.totalRequests ?? null;
}

try {
  await checkConnection();
  if (db.isPrisma) {
    throw new Error('Customer merge rollback test requires the isolated PGlite test database.');
  }
  await ensurePricingSeeded();

  const records = await processRawRecords([
    {
      customer_id: targetId,
      timestamp: '2026-09-10T10:00:00Z',
      model_name: 'gpt-4o',
      input_tokens: 1000,
      output_tokens: 100
    },
    {
      customer_id: targetId,
      timestamp: '2026-10-10T10:00:00Z',
      model_name: 'gpt-4o',
      input_tokens: 500,
      output_tokens: 50
    },
    {
      customer_id: sourceId,
      timestamp: '2026-09-10T10:00:00Z',
      model_name: 'gpt-4o',
      input_tokens: 1000,
      output_tokens: 100
    },
    {
      customer_id: sourceId,
      timestamp: '2026-09-11T10:00:00Z',
      model_name: 'gpt-4o',
      input_tokens: 250,
      output_tokens: 25
    },
    {
      customer_id: sourceId,
      timestamp: '2026-11-11T10:00:00Z',
      model_name: 'merge-unpriced-model',
      input_tokens: 5,
      output_tokens: 10
    }
  ]);
  await saveRecords(records, userId);

  const otherRecords = await processRawRecords([{
    customer_id: 'merge-foreign',
    timestamp: '2026-09-10T10:00:00Z',
    model_name: 'gpt-4o',
    input_tokens: 10,
    output_tokens: 10
  }]);
  await saveRecords(otherRecords, otherUserId);

  await updateCustomerRevenue(userId, targetId, '2026-09', '100');
  await updateCustomerRevenue(userId, targetId, '2026-10', '150');
  await updateCustomerRevenue(userId, sourceId, '2026-09', '999');
  await updateCustomerRevenue(userId, sourceId, '2026-11', '300');

  const sourceDetail = await getCustomerDetail(userId, sourceId, 'all');
  const targetBeforeMerge = await getCustomerDetail(userId, targetId, 'all');
  assert.equal(sourceDetail?.totalRequests, 3);
  assert.equal(sourceDetail?.unpricedRequests, 1);
  for (const breakdown of [sourceDetail?.models ?? [], sourceDetail?.byDay ?? []]) {
    assert.equal(breakdown.reduce((sum, row) => sum + row.requests, 0), sourceDetail?.totalRequests);
    assert.equal(breakdown.reduce((sum, row) => sum + row.totalInputTokens, 0), sourceDetail?.totalInputTokens);
    assert.equal(breakdown.reduce((sum, row) => sum + row.totalOutputTokens, 0), sourceDetail?.totalOutputTokens);
    assert.ok(Math.abs(
      breakdown.reduce((sum, row) => sum + Number(row.totalCost), 0) - Number(sourceDetail?.totalCost)
    ) < 1e-10);
  }
  assert.equal(await getCustomerDetail(otherUserId, sourceId, 'all'), null);

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = {
    Authorization: `Bearer ${createToken(userId)}`,
    'Content-Type': 'application/json'
  };

  const unauthenticatedDetail = await fetch(
    `${baseUrl}/api/customers/${encodeURIComponent(sourceId)}/detail?month=all`
  );
  assert.equal(unauthenticatedDetail.status, 401);

  const detailResponse = await fetch(
    `${baseUrl}/api/customers/${encodeURIComponent(sourceId)}/detail?month=all`,
    { headers: { Authorization: headers.Authorization } }
  );
  assert.equal(detailResponse.status, 200);
  assert.equal((await detailResponse.json()).totalRequests, 3);

  const monthDetailResponse = await fetch(
    `${baseUrl}/api/customers/${encodeURIComponent(sourceId)}/detail?month=2026-09`,
    { headers: { Authorization: headers.Authorization } }
  );
  assert.equal(monthDetailResponse.status, 200);
  assert.equal((await monthDetailResponse.json()).totalRequests, 2);

  const foreignMerge = await fetch(`${baseUrl}/api/customers/merge`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ source_customer_id: sourceId, target_customer_id: 'merge-foreign' })
  });
  assert.equal(foreignMerge.status, 404);
  assert.equal(await customerRequests(sourceId), 3);
  assert.equal(await customerRequests(targetId), 2);

  const functionSql = `
    CREATE FUNCTION ${functionName}() RETURNS trigger
    LANGUAGE plpgsql AS $$
    BEGIN
      IF OLD.user_id = '${userId}' AND OLD.customer_id = '${sourceId}' THEN
        RAISE EXCEPTION 'injected merge rollback test';
      END IF;
      RETURN OLD;
    END;
    $$;
  `;
  await db.$queryRaw(functionSql);
  rollbackFunctionCreated = true;
  await db.$queryRaw(
    `CREATE TRIGGER ${triggerName} BEFORE DELETE ON revenue_versions
     FOR EACH ROW EXECUTE FUNCTION ${functionName}();`
  );
  rollbackTriggerCreated = true;
  await assert.rejects(mergeCustomerInto(userId, sourceId, targetId), /injected merge rollback test/);
  await db.$queryRaw(`DROP TRIGGER ${triggerName} ON revenue_versions;`);
  rollbackTriggerCreated = false;
  await db.$queryRaw(`DROP FUNCTION ${functionName}();`);
  rollbackFunctionCreated = false;
  assert.equal(await customerRequests(sourceId), 3);
  assert.equal(await customerRequests(targetId), 2);

  const mergeResponse = await fetch(`${baseUrl}/api/customers/merge`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ source_customer_id: sourceId, target_customer_id: targetId })
  });
  assert.equal(mergeResponse.status, 200);
  const result = await mergeResponse.json();
  assert.equal(result.movedRequests, 3);
  assert.equal(result.duplicateRequestsRemoved, 1);
  assert.equal(result.copiedRevenueVersions, 1);
  assert.equal(result.revenueConflicts, 1);
  assert.equal(await customerRequests(sourceId), null);

  const targetDetail = await getCustomerDetail(userId, targetId, 'all');
  assert.equal(targetDetail?.totalRequests, 4);
  assert.equal(targetDetail?.unpricedRequests, 1);
  const duplicateCost = Number((await getUsageCosts(userId, [{
    modelName: 'gpt-4o',
    timestamp: new Date('2026-09-10T10:00:00Z'),
    inputTokens: 1000,
    outputTokens: 100
  }]))[0].cost);
  assert.ok(Math.abs(
    Number(targetDetail?.totalCost) -
    (Number(targetBeforeMerge?.totalCost) + Number(sourceDetail?.totalCost) - duplicateCost)
  ) < 1e-10);
  for (const breakdown of [targetDetail?.models ?? [], targetDetail?.byDay ?? []]) {
    assert.equal(breakdown.reduce((sum, row) => sum + row.requests, 0), targetDetail?.totalRequests);
    assert.equal(breakdown.reduce((sum, row) => sum + row.totalInputTokens, 0), targetDetail?.totalInputTokens);
    assert.equal(breakdown.reduce((sum, row) => sum + row.totalOutputTokens, 0), targetDetail?.totalOutputTokens);
    assert.ok(Math.abs(
      breakdown.reduce((sum, row) => sum + Number(row.totalCost), 0) - Number(targetDetail?.totalCost)
    ) < 1e-10);
  }
  assert.deepEqual(
    targetDetail?.revenueHistory.map(row => [row.effectiveMonth, row.monthlyRevenueUsd]),
    [['2026-11', '300.00'], ['2026-10', '150.00'], ['2026-09', '100.00']]
  );
  assert.equal(await getCustomerDetail(otherUserId, 'merge-foreign', 'all').then(row => row?.totalRequests), 1);

  const caseSourceId = 'CUST_CASE_TEST';
  const caseTargetId = 'cust_case_test';
  await saveRecords(await processRawRecords([
    ...[1, 2].map(day => ({
      customer_id: caseSourceId,
      timestamp: `2026-12-0${day}T00:00:00Z`,
      model_name: 'gpt-4o',
      input_tokens: 1000,
      output_tokens: 100
    })),
    ...[3, 4].map(day => ({
      customer_id: caseTargetId,
      timestamp: `2026-12-0${day}T00:00:00Z`,
      model_name: 'gpt-4o',
      input_tokens: 2000,
      output_tokens: 200
    }))
  ]), userId);
  const caseSourceBefore = await getCustomerDetail(userId, caseSourceId, 'all');
  const caseTargetBefore = await getCustomerDetail(userId, caseTargetId, 'all');
  await mergeCustomerInto(userId, caseSourceId, caseTargetId);
  const caseMerged = await getCustomerDetail(userId, caseTargetId, 'all');
  assert.equal(caseMerged?.totalRequests, 4);
  assert.ok(Math.abs(
    Number(caseMerged?.totalCost) -
    (Number(caseSourceBefore?.totalCost) + Number(caseTargetBefore?.totalCost))
  ) < 1e-10);
  assert.equal(await getCustomerDetail(userId, caseSourceId, 'all'), null);

  console.log('PASS customer details are authenticated, month-aware, and tenant-scoped');
  console.log('PASS merge rejects customers not owned by the authenticated user without changing records');
  console.log('PASS merge transaction rolls back usage changes when revenue transfer fails');
  console.log('PASS merge collapses duplicate usage and preserves target-wins revenue history');
} finally {
  if (server.listening) await new Promise(resolve => server.close(resolve));
  if (rollbackTriggerCreated) await db.$queryRaw(`DROP TRIGGER ${triggerName} ON revenue_versions;`);
  if (rollbackFunctionCreated) await db.$queryRaw(`DROP FUNCTION ${functionName}();`);
  await clearAllData(userId);
  await clearAllData(otherUserId);
  await db.$disconnect();
}
