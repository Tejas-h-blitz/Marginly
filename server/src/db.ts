import { Prisma, PrismaClient } from '@prisma/client';
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
    findMany(args: { where: { userId: string } }): Promise<Array<{
      customerId: string;
      monthlyRevenueUsd: string | null;
    }>>;
    updateMany(args: {
      where: { userId: string; customerId: string };
      data: { monthlyRevenueUsd: string | null };
    }): Promise<{ count: number }>;
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
    }> }): Promise<{ count: number }>;
    findMany(args?: {
      where?: {
        userId?: string;
        timestamp?: { gte: Date; lt: Date } | null;
      };
    }): Promise<Array<{
      customerId: string;
      modelName: string;
      inputTokens: number;
      outputTokens: number;
      timestamp: Date | null;
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

    const recalculationMigration = path.resolve(__dirname, '../prisma/migrations/20261103000000_recalculate_costs_from_tokens/migration.sql');
    await pgliteInstance.exec(fs.readFileSync(recalculationMigration, 'utf-8'));

    const monthlyRevenueMigration = path.resolve(__dirname, '../prisma/migrations/20261104000000_monthly_revenue/migration.sql');
    await pgliteInstance.exec(fs.readFileSync(monthlyRevenueMigration, 'utf-8'));
  }
  return pgliteInstance;
}

export async function checkConnection(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !dbUrl?.trim()) {
    throw new Error('DATABASE_URL is required in production.');
  }
  const parsedUrl = dbUrl ? new URL(dbUrl) : null;
  const host = parsedUrl?.hostname;
  const localHost = !parsedUrl
    ? 'localhost'
    : host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
      ? host
      : null;

  if (localHost) {
    const port = parsedUrl?.port ? Number(parsedUrl.port) : 5432;
    const reachable = await isHostPortReachable(localHost, port, 250);
    if (!reachable) {
      if (isProduction) {
        throw new Error('PostgreSQL is unavailable; embedded PGlite is disabled in production.');
      }
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
    if (isProduction) {
      throw new Error('Could not connect to DATABASE_URL; embedded PGlite is disabled in production.');
    }
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
      const userId = args.create.userId;
      const customerId = args.create.customerId;
      await pg.query(`
        INSERT INTO customers (id, user_id, customer_id, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, customer_id) DO NOTHING;
      `, [id, userId, customerId]);
      return { userId, customerId };
    },

    async findMany(args) {
      if (usePrisma) {
        const customers = await prisma.customer.findMany({
          where: args.where,
          select: { customerId: true, monthlyRevenueUsd: true }
        });
        return customers.map(customer => ({
          customerId: customer.customerId,
          monthlyRevenueUsd: customer.monthlyRevenueUsd?.toString() ?? null
        }));
      }
      const pg = await getPglite();
      const result = await pg.query<{
        customer_id: string;
        monthly_revenue_usd: string | null;
      }>(
        'SELECT customer_id, monthly_revenue_usd FROM customers WHERE user_id = $1;',
        [args.where.userId]
      );
      return result.rows.map(customer => ({
        customerId: customer.customer_id,
        monthlyRevenueUsd: customer.monthly_revenue_usd
      }));
    },

    async updateMany(args) {
      if (usePrisma) {
        return prisma.customer.updateMany({
          where: args.where,
          data: {
            monthlyRevenueUsd: args.data.monthlyRevenueUsd === null
              ? null
              : new Prisma.Decimal(args.data.monthlyRevenueUsd)
          }
        });
      }
      const pg = await getPglite();
      const result = await pg.query<{ customer_id: string }>(
        'UPDATE customers SET monthly_revenue_usd = $3, updated_at = NOW() WHERE user_id = $1 AND customer_id = $2 RETURNING customer_id;',
        [args.where.userId, args.where.customerId, args.data.monthlyRevenueUsd]
      );
      return { count: result.rows.length };
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
        const userId = r.userId;
        await pg.query(`
          INSERT INTO usage_records (
            id, user_id, customer_id, timestamp, model_name,
            input_tokens, output_tokens
          ) VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [
          id,
          userId,
          r.customerId,
          r.timestamp ? r.timestamp.toISOString() : null,
          r.modelName,
          r.inputTokens,
          r.outputTokens
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
      const timestampRange = args?.where?.timestamp && args.where.timestamp !== null
        ? args.where.timestamp
        : undefined;
      let res;
      if (userId && timestampRange) {
        res = await pg.query<{
          customer_id: string;
          model_name: string;
          input_tokens: number;
          output_tokens: number;
          timestamp: Date | null;
        }>(
          'SELECT customer_id, model_name, input_tokens, output_tokens, timestamp FROM usage_records WHERE user_id = $1 AND timestamp >= $2 AND timestamp < $3;',
          [userId, timestampRange.gte.toISOString(), timestampRange.lt.toISOString()]
        );
      } else if (userId) {
        res = await pg.query<{
          customer_id: string;
          model_name: string;
          input_tokens: number;
          output_tokens: number;
          timestamp: Date | null;
        }>('SELECT customer_id, model_name, input_tokens, output_tokens, timestamp FROM usage_records WHERE user_id = $1;', [userId]);
      } else {
        res = await pg.query<{
          customer_id: string;
          model_name: string;
          input_tokens: number;
          output_tokens: number;
          timestamp: Date | null;
        }>('SELECT customer_id, model_name, input_tokens, output_tokens, timestamp FROM usage_records;');
      }

      return res.rows.map(r => ({
        customerId: r.customer_id,
        modelName: r.model_name,
        inputTokens: Number(r.input_tokens),
        outputTokens: Number(r.output_tokens),
        timestamp: r.timestamp ? new Date(r.timestamp) : null
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
