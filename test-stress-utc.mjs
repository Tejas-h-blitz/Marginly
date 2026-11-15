import { spawn } from 'child_process';
import path from 'path';

function runWorkerWithTz(tz) {
  return new Promise((resolve, reject) => {
    const workerPath = path.resolve('test-stress-worker.mjs');
    const child = spawn(process.execPath, [workerPath], {
      env: {
        ...process.env,
        TZ: tz,
        NODE_ENV: 'test'
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr, tz });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

function stripColorsAndTimestamps(str) {
  return str
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/user stress_test_user_\d+/g, 'user <USER_ID>')
    .replace(/user_stress_test_user_\d+/g, '<USER_ID>')
    .replace(/Running Stress & UTC Bucketing Tests in TZ=[^\n]+/g, 'Running Stress & UTC Bucketing Tests')
    .replace(/Test Summary for TZ=[^\n]+/g, 'Test Summary')
    .trim();
}

async function main() {
  console.log('Starting Marginly UTC & Multi-Timezone Stress Test Suite...\n');

  const timezones = ['UTC', 'America/Los_Angeles', 'Asia/Kolkata', 'Pacific/Auckland'];
  const results = [];
  for (const timezone of timezones) {
    const result = await runWorkerWithTz(timezone);
    results.push(result);
    process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  if (results.some(result => result.code !== 0)) {
    console.error('\nTests failed in one or more timezones.');
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('Timezone Comparison Verification:');
  const normalizedResults = results.map(result => stripColorsAndTimestamps(result.stdout));
  if (normalizedResults.every(result => result === normalizedResults[0])) {
    console.log(`✓ PASS: Results are identical under TZ=${timezones.join(', ')}.`);
  } else {
    console.error('✗ FAIL: Discrepancy detected between timezones!');
    process.exit(1);
  }
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('Error running timezone tests:', err);
  process.exit(1);
});
