import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
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

// GET /api/summary
apiRouter.get('/summary', async (_req: Request, res: Response): Promise<void> => {
  try {
    const summary = await getOverallSummary();
    res.json(summary);
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary metrics' });
  }
});

// GET /api/customers
apiRouter.get('/customers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const breakdown = await getCustomersBreakdown();
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

    const inserted = await saveRecords(calculated);
    const summary = await getOverallSummary();

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

    const inserted = await saveRecords(calculated);
    const summary = await getOverallSummary();

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
apiRouter.post('/load-sample', async (_req: Request, res: Response): Promise<void> => {
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
    const inserted = await saveRecords(calculated);
    const summary = await getOverallSummary();

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
apiRouter.post('/clear', async (_req: Request, res: Response): Promise<void> => {
  try {
    await clearAllData();
    res.json({ success: true, message: 'All usage data cleared successfully.' });
  } catch (err) {
    console.error('Error clearing data:', err);
    res.status(500).json({ error: 'Failed to clear usage data' });
  }
});

// GET /api/export
apiRouter.get('/export', async (_req: Request, res: Response): Promise<void> => {
  try {
    const customers = await getCustomersBreakdown();
    const csvData = generateCustomerBreakdownCsv(customers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customer_cost_breakdown.csv"');
    res.send(csvData);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Failed to export CSV report' });
  }
});
