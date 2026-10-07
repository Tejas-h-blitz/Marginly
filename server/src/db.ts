import { PrismaClient } from '@prisma/client';
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface IDatabase {
  isPrisma: boolean;
  customer: {
    upsert(args: {
      where: { userId_customerId: { userId: string; customerId: string } };
      update: Record<string, unknown>;
      create: { userId: string; customerId: string };
    }): Promise<unknown>;
    deleteMany(args?: { where?: { userId?: string } }): Promise<unknown>;
  };
  usageRecord: {
    createMany(args: { data: Array<{
      userId: string;
      customerId: string;
      timestamp: Date | null;
      modelName: string;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      inputCost: number;
      outputCost: number;
      totalCost: number;
    }> }): Promise<{ count: number }>;
    findMany(args?: {
      where?: { userId?: string };
      select?: {
        customerId?: boolean;
        inputTokens?: boolean;
        outputTokens?: boolean;
        totalTokens?: boolean;
        totalCost?: boolean;
      };
    }): Promise<Array<{
      customerId: string;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      totalCost: number;
    }>>;
    deleteMany(args?: { where?: { userId?: string } }): Promise<unknown>;
  };
  modelPricing: {
    findMany(): Promise<Array<{
      id: string;
      modelName: string;
      displayName: string;
      provider: string;
      costPer1kInput: number;
      costPer1kOutput: number;
    }>>;
    upsert(args: {
      where: { modelName: string };
      update: Record<string, unknown>;
      create: {
        modelName: string;
        displayName: string;
        provider: string;
        costPer1kInput: number;
        costPer1kOutput: number;
      };
    }): Promise<unknown>;
  };
  $disconnect(): Promise<void>;
  $transaction<T>(fn: (tx: IDatabase) => Promise<T>): Promise<T>;
}

import net from 'net';

import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const prisma = new PrismaClient();

let pgliteInstance: PGlite | null = null;
let usePrisma = true;

function isHostPortReachable(host: string, port: number, timeoutMs = 250): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function getPglite(): Promise<PGlite> {
  if (!pgliteInstance) {
    const dbDir = path.resolve(__dirname, '../../dev-postgres-data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    pgliteInstance = new PGlite(dbDir);

    // Apply init migration SQL
    const initMigrationPath = path.resolve(__dirname, '../prisma/migrations/20260922000000_init/migration.sql');
    if (fs.existsSync(initMigrationPath)) {
      try {
        const sql = fs.readFileSync(initMigrationPath, 'utf-8');
        await pgliteInstance.exec(sql);
      } catch {
        // Tables already created
      }
    }

    // Apply multi-tenancy migration SQL
    const multiTenancyMigrationPath = path.resolve(__dirname, '../prisma/migrations/20261002000000_add_user_id_multi_tenancy/migration.sql');
    if (fs.existsSync(multiTenancyMigrationPath)) {
      try {
        const sql = fs.readFileSync(multiTenancyMigrationPath, 'utf-8');
        await pgliteInstance.exec(sql);
      } catch {
        // Migration already applied or partial
      }
    }

    // Ensure columns, constraints, and indexes exist idempotently
    try {
      await pgliteInstance.exec(`
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'demo-user';
        ALTER TABLE usage_records ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'demo-user';
        DROP INDEX IF EXISTS customers_customer_id_key;
        CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_customer_id_key ON customers(user_id, customer_id);
        CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id);
        CREATE INDEX IF NOT EXISTS usage_records_user_id_idx ON usage_records(user_id);
        CREATE INDEX IF NOT EXISTS usage_records_user_id_customer_id_idx ON usage_records(user_id, customer_id);
      `);
    } catch {
      // Ignored if already up to date
    }
  }
  return pgliteInstance;
}

export async function checkConnection(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL || 'localhost:5432';
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

  if (isLocal) {
    const reachable = await isHostPortReachable('127.0.0.1', 5432, 250);
    if (!reachable) {
      usePrisma = false;
      console.log('[Database] Local PostgreSQL server not detected on port 5432.');
      console.log('[Database] Using embedded PostgreSQL instance with identical schema.');
      await getPglite();
      return false;
    }
  }

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out')), 2000)
    );
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);
    usePrisma = true;
    console.log('[Database] Connected to PostgreSQL via Prisma.');
    return true;
  } catch {
    usePrisma = false;
    console.log('[Database] Running with local embedded PostgreSQL engine (PGlite) using identical PostgreSQL schema.');
    await getPglite();
    return false;
  }
}

// Unified Database Accessor
export const db: IDatabase = {
  get isPrisma() {
    return usePrisma;
  },

  customer: {
    async upsert(args) {
      if (usePrisma) {
        return (prisma as any).customer.upsert(args);
      }
      const pg = await getPglite();
      const id = crypto.randomUUID();
      const userId = args.create.userId || 'demo-user';
      const customerId = args.create.customerId;
      await pg.query(`
        INSERT INTO customers (id, user_id, customer_id, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, customer_id) DO NOTHING;
      `, [id, userId, customerId]);
      return { userId, customerId };
    },

    async deleteMany(args) {
      if (usePrisma) {
        return (prisma as any).customer.deleteMany(args);
      }
      const pg = await getPglite();
      if (args?.where?.userId) {
        return pg.query('DELETE FROM customers WHERE user_id = $1;', [args.where.userId]);
      }
      return pg.query('DELETE FROM customers;');
    }
  },

  usageRecord: {
    async createMany(args) {
      if (usePrisma) {
        return (prisma as any).usageRecord.createMany(args);
      }
      const pg = await getPglite();
      for (const r of args.data) {
        const id = crypto.randomUUID();
        const userId = r.userId || 'demo-user';
        await pg.query(`
          INSERT INTO usage_records (
            id, user_id, customer_id, timestamp, model_name,
            input_tokens, output_tokens, total_tokens,
            input_cost, output_cost, total_cost
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
        `, [
          id,
          userId,
          r.customerId,
          r.timestamp ? r.timestamp.toISOString() : null,
          r.modelName,
          r.inputTokens,
          r.outputTokens,
          r.totalTokens,
          r.inputCost,
          r.outputCost,
          r.totalCost
        ]);
      }
      return { count: args.data.length };
    },

    async findMany(args) {
      if (usePrisma) {
        return (prisma as any).usageRecord.findMany(args);
      }
      const pg = await getPglite();
      const userId = args?.where?.userId;
      let res;
      if (userId) {
        res = await pg.query<{
          customer_id: string;
          input_tokens: number;
          output_tokens: number;
          total_tokens: number;
          total_cost: number;
        }>('SELECT customer_id, input_tokens, output_tokens, total_tokens, total_cost FROM usage_records WHERE user_id = $1;', [userId]);
      } else {
        res = await pg.query<{
          customer_id: string;
          input_tokens: number;
          output_tokens: number;
          total_tokens: number;
          total_cost: number;
        }>('SELECT customer_id, input_tokens, output_tokens, total_tokens, total_cost FROM usage_records;');
      }

      return res.rows.map(r => ({
        customerId: r.customer_id,
        inputTokens: Number(r.input_tokens),
        outputTokens: Number(r.output_tokens),
        totalTokens: Number(r.total_tokens),
        totalCost: Number(r.total_cost)
      }));
    },

    async deleteMany(args) {
      if (usePrisma) {
        return (prisma as any).usageRecord.deleteMany(args);
      }
      const pg = await getPglite();
      if (args?.where?.userId) {
        return pg.query('DELETE FROM usage_records WHERE user_id = $1;', [args.where.userId]);
      }
      return pg.query('DELETE FROM usage_records;');
    }
  },

  modelPricing: {
    async findMany() {
      if (usePrisma) {
        return (prisma as any).modelPricing.findMany();
      }
      const pg = await getPglite();
      const res = await pg.query<{
        id: string;
        model_name: string;
        display_name: string;
        provider: string;
        cost_per_1k_input: number;
        cost_per_1k_output: number;
      }>('SELECT id, model_name, display_name, provider, cost_per_1k_input, cost_per_1k_output FROM model_pricing;');

      return res.rows.map(r => ({
        id: r.id,
        modelName: r.model_name,
        displayName: r.display_name,
        provider: r.provider,
        costPer1kInput: Number(r.cost_per_1k_input),
        costPer1kOutput: Number(r.cost_per_1k_output)
      }));
    },

    async upsert(args) {
      if (usePrisma) {
        return (prisma as any).modelPricing.upsert(args);
      }
      const pg = await getPglite();
      const id = crypto.randomUUID();
      await pg.query(`
        INSERT INTO model_pricing (id, model_name, display_name, provider, cost_per_1k_input, cost_per_1k_output, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (model_name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          provider = EXCLUDED.provider,
          cost_per_1k_input = EXCLUDED.cost_per_1k_input,
          cost_per_1k_output = EXCLUDED.cost_per_1k_output,
          updated_at = NOW();
      `, [
        id,
        args.create.modelName,
        args.create.displayName,
        args.create.provider,
        args.create.costPer1kInput,
        args.create.costPer1kOutput
      ]);
      return args.create;
    }
  },

  async $disconnect() {
    if (usePrisma) {
      await prisma.$disconnect();
    }
    if (pgliteInstance) {
      await pgliteInstance.close();
      pgliteInstance = null;
    }
  },

  async $transaction<T>(fn: (tx: IDatabase) => Promise<T>): Promise<T> {
    if (usePrisma) {
      return (prisma as any).$transaction(async () => fn(db));
    }
    return fn(db);
  }
};

export default db;
