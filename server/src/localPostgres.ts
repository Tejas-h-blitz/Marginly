import net from 'net';
import fs from 'fs';
import path from 'path';

// Checks if a port is in use
export function isPortInUse(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') resolve(true);
        else resolve(false);
      })
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close();
      })
      .listen(port, host);
  });
}

// Starts local Postgres wire protocol instance if not already running on port 5432
export async function ensureLocalPostgres(port = 5432): Promise<void> {
  const inUse = await isPortInUse(port);
  if (inUse) {
    console.log(`[PostgreSQL] Port ${port} is active (external or local daemon).`);
    return;
  }

  console.log(`[PostgreSQL] Launching local embedded PostgreSQL engine on port ${port}...`);
  try {
    // Dynamic imports so it only loads if needed
    const { PGlite } = await import('@electric-sql/pglite');
    const { createServer } = await import('pglite-server');

    const dbDir = path.resolve(__dirname, '../../dev-postgres-data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const pglite = new PGlite(dbDir);

    // Apply migration SQL if tables don't exist
    const migrationPath = path.resolve(__dirname, '../prisma/migrations/20260922000000_init/migration.sql');
    if (fs.existsSync(migrationPath)) {
      try {
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        await pglite.exec(sql);
      } catch (err: unknown) {
        // Tables may already exist
      }
    }

    const server = createServer(pglite);
    await new Promise<void>((resolve) => {
      server.listen(port, '127.0.0.1', () => {
        console.log(`[PostgreSQL] Local PostgreSQL wire server ready on 127.0.0.1:${port}`);
        resolve();
      });
    });
  } catch (err) {
    console.warn('[PostgreSQL] Could not start local embedded engine:', err);
  }
}
