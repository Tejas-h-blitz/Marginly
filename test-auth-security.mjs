import { spawn } from 'child_process';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function logPass(title, detail = '') {
  passed++;
  console.log(`  ${GREEN}✓${RESET} ${title}${detail ? ` ${GRAY}(${detail})${RESET}` : ''}`);
}

function logFail(title, error = '') {
  failed++;
  console.log(`  ${RED}✗${RESET} ${BOLD}${title}${RESET}`);
  if (error) console.log(`    ${RED}Error:${RESET} ${error}`);
}

function printSection(title) {
  console.log(`\n${BOLD}${CYAN}=== ${title} ===${RESET}`);
}

function createJwt(payloadObj, signature = 'mock_e2e_signature') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

function createSignedJwt(payloadObj, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function executeAuthMiddleware(getAuthenticatedUserId, authHeader) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
    query: {}
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    }
  };

  let nextCalled = false;
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Authentication required.' });
  } else {
    nextCalled = true;
  }

  return { status: res.statusCode, body: res.body, nextCalled, userId };
}

async function runSecurityTestSuite() {
  console.log(`\n${BOLD}====================================================${RESET}`);
  console.log(`${BOLD}  Marginly Auth & JWT Security Verification Suite  ${RESET}`);
  console.log(`${BOLD}====================================================${RESET}\n`);

  const serverEntry = path.resolve(__dirname, 'server/dist/index.js');
  const apiEntry = path.resolve(__dirname, 'server/dist/routes/api.js');

  // Import the compiled getAuthenticatedUserId & verifyTestAuthToken
  const { getAuthenticatedUserId, verifyTestAuthToken } = await import(pathToFileURL(apiEntry).href);

  // =========================================================================
  // TEST SUITE 1: Server Startup Guard (Production + TEST_AUTH_SECRET Refusal)
  // =========================================================================
  printSection('Test 1: Server Refusal in Production with TEST_AUTH_SECRET');

  try {
    const refusalChild = spawn(
      process.execPath,
      [serverEntry],
      {
        cwd: __dirname,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          TEST_AUTH_SECRET: 'any_test_secret_key',
          PORT: '3091'
        },
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );

    let stderrOutput = '';
    refusalChild.stderr.on('data', (d) => {
      stderrOutput += d.toString();
    });

    const exitCode = await new Promise((resolve) => {
      refusalChild.on('exit', (code) => resolve(code));
    });

    if (exitCode !== 0 && (stderrOutput.includes('TEST_AUTH_SECRET') || stderrOutput.includes('refusing to start') || stderrOutput.includes('FATAL'))) {
      logPass(
        'Server refused to start when TEST_AUTH_SECRET is set with NODE_ENV=production',
        `Exit code ${exitCode}, log: ${stderrOutput.trim()}`
      );
    } else {
      logFail('Server did not refuse startup in production mode with TEST_AUTH_SECRET', `Exit code: ${exitCode}, output: ${stderrOutput}`);
    }
  } catch (err) {
    logFail('Test 1 execution error', err.message);
  }

  // =========================================================================
  // TEST SUITE 2: Outside Test Mode (Normal Mode / NODE_ENV !== 'test')
  // Proves forged tokens, expired tokens, and different user tokens return 401.
  // =========================================================================
  printSection('Test 2: Token Rejection Outside Test Mode (NODE_ENV=development)');

  // Ensure environment is strictly outside test mode
  process.env.NODE_ENV = 'development';
  delete process.env.TEST_AUTH_SECRET;

  const testCasesOutsideTestMode = [
    {
      name: 'Combination 1: Hand-forged JWT with sub "user_e2e_tester_999" and signature "mock_e2e_signature"',
      token: createJwt({
        sub: 'user_e2e_tester_999',
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'mock_e2e_signature')
    },
    {
      name: 'Combination 2: Hand-forged JWT with sub "user_e2e_tester_999" and random signature "random_forged_sig_xyz"',
      token: createJwt({
        sub: 'user_e2e_tester_999',
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'random_forged_sig_xyz')
    },
    {
      name: 'Combination 3: Hand-forged JWT for different user "user_other_attacker_888" and signature "mock_e2e_signature"',
      token: createJwt({
        sub: 'user_other_attacker_888',
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'mock_e2e_signature')
    },
    {
      name: 'Combination 4: Hand-forged JWT for different user "user_other_attacker_888" and random signature "random_sig_999"',
      token: createJwt({
        sub: 'user_other_attacker_888',
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'random_sig_999')
    },
    {
      name: 'Expired token outside test mode',
      token: createJwt({
        sub: 'user_e2e_tester_999',
        exp: Math.floor(Date.now() / 1000) - 3600
      }, 'mock_e2e_signature')
    },
    {
      name: 'HMAC signed token but outside test mode (test bypass inactive)',
      token: createSignedJwt({
        sub: 'user_e2e_tester_999',
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'any_secret_key_123')
    },
    {
      name: 'Unauthenticated request with missing Authorization header',
      token: null
    }
  ];

  for (const tc of testCasesOutsideTestMode) {
    const authHeader = tc.token ? `Bearer ${tc.token}` : undefined;
    const result = executeAuthMiddleware(getAuthenticatedUserId, authHeader);

    if (result.status === 401 && result.body?.error === 'Authentication required.' && !result.nextCalled) {
      logPass(
        `${tc.name} returned HTTP 401`,
        `status: 401, error: "${result.body.error}"`
      );
    } else {
      logFail(
        `Security breach: ${tc.name} did not return 401`,
        `Received status: ${result.status}, nextCalled: ${result.nextCalled}, userId: ${result.userId}`
      );
    }
  }

  // =========================================================================
  // TEST SUITE 3: Inside Test Mode (NODE_ENV=test AND TEST_AUTH_SECRET set)
  // Only cryptographically verified HMAC-SHA256 signatures are accepted.
  // =========================================================================
  printSection('Test 3: Verification Inside Test Mode (NODE_ENV=test & TEST_AUTH_SECRET)');

  const VALID_SECRET = 'marginly_secure_test_secret_key_2026';
  process.env.NODE_ENV = 'test';
  process.env.TEST_AUTH_SECRET = VALID_SECRET;

  // 3.1: Forged token with mock_e2e_signature rejected in test mode
  const resMockSig = executeAuthMiddleware(
    getAuthenticatedUserId,
    `Bearer ${createJwt({ sub: 'user_e2e_tester_999', exp: Math.floor(Date.now() / 1000) + 3600 }, 'mock_e2e_signature')}`
  );
  if (resMockSig.status === 401) {
    logPass('Forged token with "mock_e2e_signature" rejected with HTTP 401 in test mode');
  } else {
    logFail('Forged token with "mock_e2e_signature" allowed in test mode', `Status: ${resMockSig.status}`);
  }

  // 3.2: Forged token with random signature rejected in test mode
  const resRandomSig = executeAuthMiddleware(
    getAuthenticatedUserId,
    `Bearer ${createJwt({ sub: 'user_e2e_tester_999', exp: Math.floor(Date.now() / 1000) + 3600 }, 'random_signature_abc')}`
  );
  if (resRandomSig.status === 401) {
    logPass('Forged token with random signature rejected with HTTP 401 in test mode');
  } else {
    logFail('Forged token with random signature allowed in test mode', `Status: ${resRandomSig.status}`);
  }

  // 3.3: Token signed with incorrect secret rejected in test mode
  const resWrongSecret = executeAuthMiddleware(
    getAuthenticatedUserId,
    `Bearer ${createSignedJwt({ sub: 'user_e2e_tester_999', exp: Math.floor(Date.now() / 1000) + 3600 }, 'wrong_secret_123')}`
  );
  if (resWrongSecret.status === 401) {
    logPass('Token signed with incorrect secret rejected with HTTP 401 in test mode');
  } else {
    logFail('Token with wrong secret allowed in test mode', `Status: ${resWrongSecret.status}`);
  }

  // 3.4: Expired token signed with valid secret rejected in test mode
  const resExpired = executeAuthMiddleware(
    getAuthenticatedUserId,
    `Bearer ${createSignedJwt({ sub: 'user_e2e_tester_999', exp: Math.floor(Date.now() / 1000) - 3600 }, VALID_SECRET)}`
  );
  if (resExpired.status === 401) {
    logPass('Expired token rejected with HTTP 401 in test mode');
  } else {
    logFail('Expired token allowed in test mode', `Status: ${resExpired.status}`);
  }

  // 3.5: Valid HMAC-SHA256 token signed with TEST_AUTH_SECRET accepted
  const resValid = executeAuthMiddleware(
    getAuthenticatedUserId,
    `Bearer ${createSignedJwt({ sub: 'user_e2e_tester_999', exp: Math.floor(Date.now() / 1000) + 3600 }, VALID_SECRET)}`
  );
  if (resValid.status === 200 && resValid.nextCalled && resValid.userId === 'user_e2e_tester_999') {
    logPass('Valid HMAC-SHA256 signed test token accepted with HTTP 200 OK', `userId: ${resValid.userId}`);
  } else {
    logFail('Valid signed test token rejected in test mode', `Status: ${resValid.status}`);
  }

  // Clean up
  delete process.env.TEST_AUTH_SECRET;
  process.env.NODE_ENV = 'development';

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(`\n====================================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log(`ALL AUTH SECURITY TESTS PASSED!`);
  } else {
    console.log(`SOME TESTS FAILED!`);
    process.exit(1);
  }
  console.log(`====================================================\n`);
}

runSecurityTestSuite();
