import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getAuth } from '@clerk/express';
import {
  parseCsv,
  parseJson,
  getCustomersBreakdown,
  getOverallSummary,
  getCustomerDetail,
  mergeCustomerInto,
  getImportHistory,
  importUsageRecords,
  UsageImportValidationError,
  clearAllData,
  importCustomerRevenue,
  updateCustomerRevenue
} from '../services/usageService.js';
import {
  createCustomRate,
  deleteCustomRate,
  getActivePricing,
  PriceVersionConflictError,
  PriceVersionInputError,
  updateCustomRate
} from '../services/pricingService.js';
import { generateCustomerBreakdownCsv } from '../services/exportService.js';
import { PastePayload } from '../types/index.js';
import { parseMonthlyRevenue, toMoneyString, validateMonth } from '../services/money.js';

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMPORT_BYTES }
});

export const apiRouter = Router();

const handleFileUpload = (req: Request, res: Response, next: (error?: unknown) => void): void => {
  upload.single('file')(req, res, error => {
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      res.status(tooLarge ? 413 : 400).json({
        error: tooLarge ? 'Files must be 10 MB or smaller.' : 'The uploaded file could not be processed.'
      });
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
};

function getRequestedMonth(req: Request): string | undefined {
  return validateMonth(req.query.month);
}

export function verifyTestAuthToken(token: string, secret: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const [headerB64, payloadB64, signature] = parts;

    // Cryptographically verify HMAC-SHA256 signature using TEST_AUTH_SECRET
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload || typeof payload.sub !== 'string') {
      return null;
    }

    // Check expiration timestamp
    if (payload.exp && typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

export function getAuthenticatedUserId(req: Request): string | null {
  // 1. In normal operation, only Clerk-verified sessions are accepted
  try {
    const auth = getAuth(req);
    if (auth?.userId) {
      return auth.userId;
    }
  } catch (err) {
    // Clerk verification failed
  }

  // 2. Test bypass: permitted ONLY when NODE_ENV === 'test' AND an explicit TEST_AUTH_SECRET is set.
  if (
    process.env.NODE_ENV === 'test' &&
    process.env.TEST_AUTH_SECRET
  ) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        return verifyTestAuthToken(token, process.env.TEST_AUTH_SECRET);
      }
    }
  }

  return null;
}

apiRouter.use((req: Request, res: Response, next) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  res.locals.userId = userId;
  next();
});

// GET /api/summary
apiRouter.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = res.locals.userId;
    const summary = await getOverallSummary(userId, getRequestedMonth(req));
    res.json(summary);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Month must be')) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary metrics' });
  }
});

// GET /api/customers
apiRouter.get('/customers', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = res.locals.userId;
    const breakdown = await getCustomersBreakdown(userId, getRequestedMonth(req));
    res.json(breakdown);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Month must be')) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customer breakdown' });
  }
});

apiRouter.get('/customers/:customerId/detail', async (req: Request, res: Response): Promise<void> => {
  try {
    const month = getRequestedMonth(req) ?? 'all';
    const detail = await getCustomerDetail(res.locals.userId, req.params.customerId, month);
    if (!detail) {
      res.status(404).json({ error: 'Customer not found for this account.' });
      return;
    }
    res.json(detail);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Month must be')) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Error fetching customer details:', err);
    res.status(500).json({ error: 'Failed to fetch customer details.' });
  }
});

apiRouter.post('/customers/merge', async (req: Request, res: Response): Promise<void> => {
  const sourceCustomerId = typeof req.body?.source_customer_id === 'string'
    ? req.body.source_customer_id.trim()
    : '';
  const targetCustomerId = typeof req.body?.target_customer_id === 'string'
    ? req.body.target_customer_id.trim()
    : '';
  try {
    const result = await mergeCustomerInto(res.locals.userId, sourceCustomerId, targetCustomerId);
    res.json({
      success: true,
      revenueConflictPolicy: 'target_wins',
      message: `Merged ${sourceCustomerId} into ${targetCustomerId}. ${result.duplicateRequestsRemoved} duplicate usage records were removed; ${result.revenueConflicts} revenue-month conflicts kept the target value.`,
      ...result
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to merge customers.';
    const status = message.startsWith('Source or target customer') ? 404 : 400;
    if (status === 400 && !message.startsWith('Both customer IDs') &&
        !message.startsWith('Source and target')) {
      console.error('Error merging customers:', err);
      res.status(500).json({ error: 'Failed to merge customers.' });
      return;
    }
    res.status(status).json({ error: message });
  }
});

// PUT /api/customers/:customerId/revenue
apiRouter.put('/customers/:customerId/revenue', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawRevenue = req.body?.monthly_revenue_usd;
    const revenue = rawRevenue === null ? null : toMoneyString(parseMonthlyRevenue(rawRevenue));
    const rawMonth = req.body?.effective_month ?? req.query.month ?? new Date().toISOString().slice(0, 7);
    const effectiveMonth = validateMonth(rawMonth);
    if (!effectiveMonth || effectiveMonth === 'all') {
      res.status(400).json({ error: 'Effective month must be a specific YYYY-MM month.' });
      return;
    }
    await updateCustomerRevenue(res.locals.userId, req.params.customerId, effectiveMonth, revenue);
    res.json({ success: true, customerId: req.params.customerId, effectiveMonth, monthlyRevenueUsd: revenue });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update monthly revenue.';
    const status = message.startsWith('Monthly revenue') ||
      message.startsWith('Month must') ||
      message.startsWith('Effective month')
      ? 400
      : message.startsWith('Customer not found') ? 404 : 500;
    if (status === 500) console.error('Error updating customer revenue:', err);
    res.status(status).json({ error: message });
  }
});

// POST /api/revenue/import
apiRouter.post('/revenue/import', handleFileUpload, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file || !req.file.originalname.toLowerCase().endsWith('.csv')) {
      res.status(400).json({ error: 'Upload a CSV file with customer_id and monthly_revenue_usd columns.' });
      return;
    }
    let rows: Array<Record<string, unknown>>;
    try {
      rows = parseCsv(req.file.buffer.toString('utf-8')) as Array<Record<string, unknown>>;
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? `Invalid revenue CSV: ${err.message}` : 'Invalid revenue CSV.'
      });
      return;
    }
    if (rows.length === 0) {
      res.status(400).json({ error: 'Revenue CSV contains no data rows.' });
      return;
    }
    const headers = Object.keys(rows[0]);
    if (!headers.includes('customer_id') || !headers.includes('monthly_revenue_usd')) {
      res.status(400).json({ error: 'Revenue CSV must include customer_id and monthly_revenue_usd columns.' });
      return;
    }

    const seenCustomerMonth = new Set<string>();
    const revenueRows = rows.map((row, index) => {
      const customerId = String(row.customer_id ?? '').trim();
      if (!customerId) throw new Error(`Row ${index + 2}: customer_id is required.`);
      const rawMonth = String(row.effective_month ?? '').trim() || new Date().toISOString().slice(0, 7);
      const effectiveMonth = validateMonth(rawMonth);
      if (!effectiveMonth || effectiveMonth === 'all') {
        throw new Error(`Row ${index + 2}: effective_month must be a specific YYYY-MM month.`);
      }
      const customerMonth = `${customerId}\u0000${effectiveMonth}`;
      if (seenCustomerMonth.has(customerMonth)) {
        throw new Error(`Duplicate customer_id '${customerId}' for ${effectiveMonth} in revenue CSV.`);
      }
      seenCustomerMonth.add(customerMonth);
      return {
        customerId,
        monthlyRevenueUsd: toMoneyString(parseMonthlyRevenue(row.monthly_revenue_usd)),
        effectiveMonth
      };
    });

    const imported = await importCustomerRevenue(res.locals.userId, revenueRows);
    res.json({ success: true, importedCustomers: imported, message: `Updated monthly revenue for ${imported} customers.` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to import revenue CSV.';
    const status = message.startsWith('Unknown customer IDs')
      ? 404
      : message.startsWith('Monthly revenue') ||
        message.startsWith('Row ') ||
        message.startsWith('Duplicate customer_id') ||
        message.startsWith('Month must')
        ? 400
        : 500;
    if (status === 500) console.error('Error importing customer revenue:', err);
    res.status(status).json({ error: message });
  }
});

// GET /api/pricing
apiRouter.get('/pricing', async (_req: Request, res: Response): Promise<void> => {
  try {
    const pricing = await getActivePricing(res.locals.userId);
    res.json({
      description: 'Model pricing in USD per 1,000 tokens',
      ...pricing
    });
  } catch (err) {
    console.error('Error fetching pricing:', err);
    res.status(500).json({ error: 'Failed to fetch pricing information' });
  }
});

apiRouter.get('/import-history', async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json(await getImportHistory(res.locals.userId));
  } catch (err) {
    console.error('Error fetching import history:', err);
    res.status(500).json({ error: 'Failed to fetch import history.' });
  }
});

apiRouter.post('/custom-rates', async (req: Request, res: Response): Promise<void> => {
  try {
    const rate = await createCustomRate(res.locals.userId, req.body ?? {});
    res.status(201).json({ success: true, rate });
  } catch (err) {
    if (err instanceof PriceVersionInputError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof PriceVersionConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error('Error creating custom rate:', err);
    res.status(500).json({ error: 'Failed to create custom rate.' });
  }
});

apiRouter.put('/custom-rates', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = typeof req.body?.id === 'string' ? req.body.id : '';
    const rate = await updateCustomRate(res.locals.userId, id, req.body ?? {});
    if (!rate) {
      res.status(404).json({ error: 'Custom rate not found.' });
      return;
    }
    res.json({ success: true, rate });
  } catch (err) {
    if (err instanceof PriceVersionInputError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof PriceVersionConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error('Error updating custom rate:', err);
    res.status(500).json({ error: 'Failed to update custom rate.' });
  }
});

apiRouter.delete('/custom-rates', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = typeof req.body?.id === 'string' ? req.body.id : '';
    if (!await deleteCustomRate(res.locals.userId, id)) {
      res.status(404).json({ error: 'Custom rate not found.' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    if (err instanceof PriceVersionInputError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Error deleting custom rate:', err);
    res.status(500).json({ error: 'Failed to delete custom rate.' });
  }
});

// POST /api/upload
apiRouter.post('/upload', handleFileUpload, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Please select a CSV or JSON file.' });
      return;
    }

    const filename = req.file.originalname.toLowerCase();
    if (!filename.endsWith('.csv') && !filename.endsWith('.json')) {
      res.status(400).json({ error: 'Only CSV and JSON files are supported.' });
      return;
    }
    const content = req.file.buffer.toString('utf-8');

    let rawRows;
    try {
      if (filename.endsWith('.json')) {
        rawRows = parseJson(content);
      } else {
        rawRows = parseCsv(content);
      }
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? `Could not parse uploaded data: ${err.message}` : 'Could not parse uploaded data.'
      });
      return;
    }

    const result = await importUsageRecords(rawRows, res.locals.userId, {
      sourceName: path.basename(req.file.originalname),
      sourceType: 'upload'
    });

    res.json({
      success: true,
      message: `Imported ${result.insertedRecords} new records from '${path.basename(req.file.originalname)}'; skipped ${result.duplicateRecords} duplicates. ${result.unpricedRecords} new records were unpriced.`,
      ...result
    });
  } catch (err) {
    if (err instanceof UsageImportValidationError) {
      res.status(400).json({ error: err.message, rejectedRows: err.rejectedRows });
      return;
    }
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Failed to save uploaded usage records.' });
  }
});

// POST /api/paste
apiRouter.post('/paste', async (req: Request<{}, {}, PastePayload>, res: Response): Promise<void> => {
  try {
    const { content, format } = req.body ?? {};
    if (typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Pasted content cannot be empty.' });
      return;
    }
    if (Buffer.byteLength(content, 'utf8') > MAX_IMPORT_BYTES) {
      res.status(413).json({ error: 'Pasted usage data must be 10 MB or smaller.' });
      return;
    }

    const trimmed = content.trim();
    let rawRows;

    try {
      if (format === 'json' || trimmed.startsWith('[') || trimmed.startsWith('{')) {
        rawRows = parseJson(trimmed);
      } else {
        rawRows = parseCsv(trimmed);
      }
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? `Could not parse pasted data: ${err.message}` : 'Could not parse pasted data.'
      });
      return;
    }

    const result = await importUsageRecords(rawRows, res.locals.userId, {
      sourceName: 'Pasted usage data',
      sourceType: 'paste'
    });

    res.json({
      success: true,
      message: `Imported ${result.insertedRecords} new records; skipped ${result.duplicateRecords} duplicates. ${result.unpricedRecords} new records were unpriced.`,
      ...result
    });
  } catch (err) {
    if (err instanceof UsageImportValidationError) {
      res.status(400).json({ error: err.message, rejectedRows: err.rejectedRows });
      return;
    }
    console.error('Error processing pasted data:', err);
    res.status(500).json({ error: 'Failed to save pasted usage records.' });
  }
});

// POST /api/load-sample
apiRouter.post('/load-sample', async (req: Request, res: Response): Promise<void> => {
  try {
    // Look for sample_usage.csv in data folder
    const samplePaths = [
      path.resolve(__dirname, '../../data/sample_usage.csv'),
      path.resolve(__dirname, '../../../data/sample_usage.csv'),
      path.resolve(process.cwd(), 'data/sample_usage.csv')
    ];

    let sampleFile: string | null = null;
    for (const p of samplePaths) {
      if (fs.existsSync(p)) {
        sampleFile = p;
        break;
      }
    }

    if (!sampleFile) {
      res.status(404).json({ error: 'Sample CSV file not found on server.' });
      return;
    }

    const content = fs.readFileSync(sampleFile, 'utf-8');
    const rawRows = parseCsv(content);
    const result = await importUsageRecords(rawRows, res.locals.userId, {
      sourceName: 'Bundled sample usage',
      sourceType: 'sample'
    });

    res.json({
      success: true,
      message: `Imported ${result.insertedRecords} new sample records; skipped ${result.duplicateRecords} duplicates. ${result.unpricedRecords} new records were unpriced.`,
      ...result
    });
  } catch (err) {
    if (err instanceof UsageImportValidationError) {
      res.status(400).json({ error: err.message, rejectedRows: err.rejectedRows });
      return;
    }
    console.error('Error loading sample data:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load sample data' });
  }
});

// POST /api/clear
apiRouter.post('/clear', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = res.locals.userId;
    await clearAllData(userId);
    res.json({ success: true, message: 'Your usage records, customer revenue, import history, and custom pricing rates were cleared.' });
  } catch (err) {
    console.error('Error clearing data:', err);
    res.status(500).json({ error: 'Failed to clear usage data' });
  }
});

// GET /api/export
apiRouter.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = res.locals.userId;
    const month = getRequestedMonth(req);
    const customers = await getCustomersBreakdown(userId, month);
    const csvData = generateCustomerBreakdownCsv(customers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customer_margin_breakdown.csv"');
    res.send(csvData);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Month must be')) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Failed to export CSV report' });
  }
});
