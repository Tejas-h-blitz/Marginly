import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(new URL('./server/package.json', import.meta.url));
const express = require('express');

process.env.NODE_ENV = 'test';
process.env.TEST_AUTH_SECRET = process.env.TEST_AUTH_SECRET || 'marginly_50k_benchmark_test_secret';
if (!process.env.MARGINLY_TEST_PGLITE_DIR) {
  throw new Error('MARGINLY_TEST_PGLITE_DIR must point to an isolated database copy.');
}

const { apiRouter, getAuthenticatedUserId } = await import('./server/dist/routes/api.js');
const { checkConnection, db } = await import('./server/dist/db.js');
const { ensurePricingSeeded } = await import('./server/dist/services/pricingService.js');
const { clearAllData } = await import('./server/dist/services/usageService.js');

function createToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.TEST_AUTH_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

const userId = `perf_50k_${Date.now()}`;
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
  next(error);
});
const server = createServer(app);

function elapsedMs(start) {
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}

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
  const lines = ['customer_id,timestamp,model_name,input_tokens,output_tokens'];
  for (let index = 0; index < 50000; index++) {
    const customer = `bench-customer-${String(index % 1000).padStart(4, '0')}`;
    const timestamp = new Date(Date.UTC(2026, 9, 1, 0, 0, index)).toISOString();
    lines.push(`${customer},${timestamp},gpt-4o,1000,250`);
  }
  const csv = lines.join('\n');

  const importStart = process.hrtime.bigint();
  const importResponse = await fetch(`${baseUrl}/api/paste`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: csv, format: 'csv' })
  });
  const importResult = await importResponse.json();
  const importMs = elapsedMs(importStart);
  assert.equal(importResponse.status, 200, JSON.stringify(importResult));
  assert.equal(importResult.insertedRecords, 50000);

  const summaryStart = process.hrtime.bigint();
  const summaryResponse = await fetch(`${baseUrl}/api/summary?month=all`, {
    headers: { Authorization: headers.Authorization }
  });
  const summary = await summaryResponse.json();
  const summaryMs = elapsedMs(summaryStart);
  assert.equal(summaryResponse.status, 200);
  assert.equal(summary.totalRequests, 50000);

  const customersStart = process.hrtime.bigint();
  const customersResponse = await fetch(`${baseUrl}/api/customers?month=all`, {
    headers: { Authorization: headers.Authorization }
  });
  const customers = await customersResponse.json();
  const customersMs = elapsedMs(customersStart);
  assert.equal(customersResponse.status, 200);
  assert.equal(customers.length, 1000);

  console.log(`Rows imported: ${importResult.insertedRecords}`);
  console.log(`Import request: ${importMs.toFixed(2)} ms`);
  console.log(`/api/summary: ${summaryMs.toFixed(2)} ms`);
  console.log(`/api/customers: ${customersMs.toFixed(2)} ms`);
  console.log(`Database: embedded PGlite (${db.isPrisma ? 'unexpected Prisma connection' : 'PGlite'})`);
  console.log(`Node: ${process.version}`);
  console.log(`CPU: ${os.cpus()[0]?.model ?? 'unknown'} (${os.cpus().length} logical processors)`);
  console.log(`RAM: ${(os.totalmem() / (1024 ** 3)).toFixed(2)} GiB`);
} finally {
  if (server.listening) await new Promise(resolve => server.close(resolve));
  await clearAllData(userId);
  await db.$disconnect();
}
