import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { apiRouter } from './routes/api.js';
import { prisma } from './db.js';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Clerk Authentication Middleware (if secret key configured)
import { clerkMiddleware } from '@clerk/express';
if (process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY.trim().startsWith('sk_')) {
  app.use(clerkMiddleware());
  console.log('[Auth] Clerk middleware enabled with CLERK_SECRET_KEY.');
}

// API Routes
app.use('/api', apiRouter);

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend in production if built
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

import { checkConnection } from './db.js';

let server: ReturnType<typeof app.listen>;

async function startServer() {
  await checkConnection();

  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n============================================================`);
    console.log(`  AI Usage Cost Tracker - Express Backend running on port ${PORT}`);
    console.log(`  App Ready at: http://localhost:${PORT}`);
    console.log(`  API Ready at: http://localhost:${PORT}/api`);
    console.log(`============================================================\n`);
  });
}

startServer();

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
