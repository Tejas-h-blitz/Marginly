import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getAuth } from '@clerk/express';
import {
  parseCsv,
  parseJson,
  processRawRecords,
  saveRecords,
  getCustomersBreakdown,
  getOverallSummary,
  clearAllData,
  importCustomerRevenue,
  updateCustomerRevenue
} from '../services/usageService.js';
import { getActivePricing } from '../services/pricingService.js';
import { generateCustomerBreakdownCsv } from '../services/exportService.js';
import { PastePayload } from '../types/index.js';
import { parseMonthlyRevenue, toMoneyString, validateMonth } from '../services/money.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

export const apiRouter = Router();

function getRequestedMonth(req: Request): string | undefined {
  return validateMonth(req.query.month);
}

export function getAuthenticatedUserId(req: Request): string | null {
  // 1. Official Clerk middleware auth
  try {
    const auth = getAuth(req);
    if (auth?.userId) {
      return auth.userId;
    }
  } catch (err) {
    console.warn('[Auth] Clerk getAuth threw:', err);
  }

  // 2. Fallback: Inspect Authorization Bearer token from header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          if (payload && typeof payload.sub === 'string' && payload.sub.startsWith('user_')) {
            // Verify expiration timestamp if present
            if (!payload.exp || payload.exp * 1000 > Date.now()) {
              return payload.sub;
            }
          }
        }
      } catch (err) {
        console.warn('[Auth] Bearer payload decode failed:', err);
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

// PUT /api/customers/:customerId/revenue
apiRouter.put('/customers/:customerId/revenue', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawRevenue = req.body?.monthly_revenue_usd;
    const revenue = rawRevenue === null ? null : toMoneyString(parseMonthlyRevenue(rawRevenue));
    await updateCustomerRevenue(res.locals.userId, req.params.customerId, revenue);
    res.json({ success: true, customerId: req.params.customerId, monthlyRevenueUsd: revenue });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update monthly revenue.';
    const status = message.startsWith('Monthly revenue') ? 400 : message.startsWith('Customer not found') ? 404 : 500;
    if (status === 500) console.error('Error updating customer revenue:', err);
    res.status(status).json({ error: message });
  }
});

// POST /api/revenue/import
apiRouter.post('/revenue/import', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
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

    const seenCustomerIds = new Set<string>();
    const revenueRows = rows.map((row, index) => {
      const customerId = String(row.customer_id ?? '').trim();
      if (!customerId) throw new Error(`Row ${index + 2}: customer_id is required.`);
      if (seenCustomerIds.has(customerId)) throw new Error(`Duplicate customer_id '${customerId}' in revenue CSV.`);
      seenCustomerIds.add(customerId);
      return {
        customerId,
        monthlyRevenueUsd: toMoneyString(parseMonthlyRevenue(row.monthly_revenue_usd))
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
        message.startsWith('Duplicate customer_id')
        ? 400
        : 500;
    if (status === 500) console.error('Error importing customer revenue:', err);
    res.status(status).json({ error: message });
  }
});

// GET /api/pricing
apiRouter.get('/pricing', async (_req: Request, res: Response): Promise<void> => {
  try {
    const pricing = await getActivePricing();
    res.json({
      description: 'Model pricing in USD per 1,000 tokens',
      models: pricing
    });
  } catch (err) {
    console.error('Error fetching pricing:', err);
    res.status(500).json({ error: 'Failed to fetch pricing information' });
  }
});

// POST /api/upload
apiRouter.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Please select a CSV or JSON file.' });
      return;
    }

    const filename = req.file.originalname.toLowerCase();
    const content = req.file.buffer.toString('utf-8');

    let rawRows;
    if (filename.endsWith('.json')) {
      rawRows = parseJson(content);
    } else {
      rawRows = parseCsv(content);
    }

    if (!rawRows || rawRows.length === 0) {
      res.status(400).json({ error: 'File is empty or could not be parsed.' });
      return;
    }

    const calculated = await processRawRecords(rawRows);
    if (calculated.length === 0) {
      res.status(400).json({ error: 'No valid usage records found. Ensure required columns exist.' });
      return;
    }

    const userId = res.locals.userId;
    const inserted = await saveRecords(calculated, userId);
    const summary = await getOverallSummary(userId);
    const unpricedRecords = calculated.filter(record => record.unpriced).length;

    res.json({
      success: true,
      message: `Successfully ingested ${inserted} records from '${req.file.originalname}'. ${unpricedRecords} records were unpriced.`,
      insertedRecords: inserted,
      unpricedRecords,
      summary
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to process uploaded file' });
  }
});

// POST /api/paste
apiRouter.post('/paste', async (req: Request<{}, {}, PastePayload>, res: Response): Promise<void> => {
  try {
    const { content, format } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Pasted content cannot be empty.' });
      return;
    }

    const trimmed = content.trim();
    let rawRows;

    if (format === 'json' || trimmed.startsWith('[') || trimmed.startsWith('{')) {
      rawRows = parseJson(trimmed);
    } else {
      rawRows = parseCsv(trimmed);
    }

    if (!rawRows || rawRows.length === 0) {
      res.status(400).json({ error: 'Could not extract valid usage rows from pasted data.' });
      return;
    }

    const calculated = await processRawRecords(rawRows);
    if (calculated.length === 0) {
      res.status(400).json({ error: 'No valid records found with required fields.' });
      return;
    }

    const userId = res.locals.userId;
    const inserted = await saveRecords(calculated, userId);
    const summary = await getOverallSummary(userId);
    const unpricedRecords = calculated.filter(record => record.unpriced).length;

    res.json({
      success: true,
      message: `Successfully ingested ${inserted} records. ${unpricedRecords} records were unpriced.`,
      insertedRecords: inserted,
      unpricedRecords,
      summary
    });
  } catch (err) {
    console.error('Error processing pasted data:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to process pasted data' });
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
    const calculated = await processRawRecords(rawRows);
    const userId = res.locals.userId;
    const inserted = await saveRecords(calculated, userId);
    const summary = await getOverallSummary(userId);
    const unpricedRecords = calculated.filter(record => record.unpriced).length;

    res.json({
      success: true,
      message: `Successfully loaded ${inserted} sample records. ${unpricedRecords} records were unpriced.`,
      insertedRecords: inserted,
      unpricedRecords,
      summary
    });
  } catch (err) {
    console.error('Error loading sample data:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load sample data' });
  }
});

// POST /api/clear
apiRouter.post('/clear', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = res.locals.userId;
    await clearAllData(userId);
    res.json({ success: true, message: 'All usage data cleared successfully.' });
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
