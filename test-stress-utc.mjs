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

  // Run 1: America/Los_Angeles
  const resLA = await runWorkerWithTz('America/Los_Angeles');
  process.stdout.write(resLA.stdout);
  if (resLA.stderr) process.stderr.write(resLA.stderr);

  // Run 2: Asia/Kolkata
  const resKolkata = await runWorkerWithTz('Asia/Kolkata');
  process.stdout.write(resKolkata.stdout);
  if (resKolkata.stderr) process.stderr.write(resKolkata.stderr);

  if (resLA.code !== 0 || resKolkata.code !== 0) {
    console.error('\nTests failed in one or more timezones.');
    process.exit(1);
  }

  // Compare normalized outputs
  const normLA = stripColorsAndTimestamps(resLA.stdout);
  const normKolkata = stripColorsAndTimestamps(resKolkata.stdout);

  console.log('\n====================================================');
  console.log('Timezone Comparison Verification:');
  if (normLA === normKolkata) {
    console.log('✓ PASS: Results between TZ=America/Los_Angeles and TZ=Asia/Kolkata are IDENTICAL.');
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

