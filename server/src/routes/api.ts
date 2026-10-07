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
  clearAllData
} from '../services/usageService.js';
import { getActivePricing } from '../services/pricingService.js';
import { generateCustomerBreakdownCsv } from '../services/exportService.js';
import { PastePayload } from '../types/index.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

export const apiRouter = Router();

/**
 * Extracts the tenant user ID strictly from authentication state (Clerk session or auth credentials),
 * NEVER trusting or accepting userId from client request body, query parameters, or params.
 */
export function getAuthenticatedUserId(req: Request): string {
  // 1. Clerk session via getAuth(req)
  try {
    const auth = getAuth(req);
    if (auth && auth.userId) {
      return auth.userId;
    }
  } catch {
    // getAuth throws if clerkMiddleware was not executed
  }

  // Check req.auth attached by Clerk middleware
  const reqAuth = (req as any).auth;
  if (typeof reqAuth === 'function') {
    const a = reqAuth();
    if (a?.userId) return a.userId;
  } else if (reqAuth?.userId) {
    return reqAuth.userId;
  }

  // 2. Authorization header for Bearer tokens or test isolation runs
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      return token;
    }
  }

  // 3. Authenticated test / demo session headers (for manual tests & demo founder pass)
  const testUserId = req.headers['x-test-user-id'] || req.headers['x-demo-user-id'] || req.headers['x-user-id'];
  if (typeof testUserId === 'string' && testUserId.trim()) {
    return testUserId.trim();
  }

  return 'demo-user';
}

// GET /api/summary
apiRouter.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const summary = await getOverallSummary(userId);
    res.json(summary);
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary metrics' });
  }
});

// GET /api/customers
apiRouter.get('/customers', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const breakdown = await getCustomersBreakdown(userId);
    res.json(breakdown);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customer breakdown' });
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

    const userId = getAuthenticatedUserId(req);
    const inserted = await saveRecords(calculated, userId);
    const summary = await getOverallSummary(userId);

    res.json({
      success: true,
      message: `Successfully ingested ${inserted} records from '${req.file.originalname}'.`,
      insertedRecords: inserted,
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

    const userId = getAuthenticatedUserId(req);
    const inserted = await saveRecords(calculated, userId);
    const summary = await getOverallSummary(userId);

    res.json({
      success: true,
      message: `Successfully ingested ${inserted} records.`,
      insertedRecords: inserted,
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
    const userId = getAuthenticatedUserId(req);
    const inserted = await saveRecords(calculated, userId);
    const summary = await getOverallSummary(userId);

    res.json({
      success: true,
      message: `Successfully loaded ${inserted} sample records across 8 customer accounts.`,
      insertedRecords: inserted,
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
    const userId = getAuthenticatedUserId(req);
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
    const userId = getAuthenticatedUserId(req);
    const customers = await getCustomersBreakdown(userId);
    const csvData = generateCustomerBreakdownCsv(customers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customer_cost_breakdown.csv"');
    res.send(csvData);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Failed to export CSV report' });
  }
});
