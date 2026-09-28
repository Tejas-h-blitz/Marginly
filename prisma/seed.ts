import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

const DEFAULT_PRICING = [
  { modelName: 'gpt-4o', displayName: 'GPT-4o', provider: 'OpenAI', costPer1kInput: 0.0025, costPer1kOutput: 0.0100 },
  { modelName: 'gpt-4o-mini', displayName: 'GPT-4o Mini', provider: 'OpenAI', costPer1kInput: 0.00015, costPer1kOutput: 0.0006 },
  { modelName: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', provider: 'OpenAI', costPer1kInput: 0.0100, costPer1kOutput: 0.0300 },
  { modelName: 'gpt-4', displayName: 'GPT-4', provider: 'OpenAI', costPer1kInput: 0.0300, costPer1kOutput: 0.0600 },
  { modelName: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo', provider: 'OpenAI', costPer1kInput: 0.0005, costPer1kOutput: 0.0015 },
  { modelName: 'o1', displayName: 'OpenAI o1', provider: 'OpenAI', costPer1kInput: 0.0150, costPer1kOutput: 0.0600 },
  { modelName: 'o1-mini', displayName: 'OpenAI o1-mini', provider: 'OpenAI', costPer1kInput: 0.0030, costPer1kOutput: 0.0120 },
  { modelName: 'o3-mini', displayName: 'OpenAI o3-mini', provider: 'OpenAI', costPer1kInput: 0.0011, costPer1kOutput: 0.0044 },
  { modelName: 'claude-3-7-sonnet', displayName: 'Claude 3.7 Sonnet', provider: 'Anthropic', costPer1kInput: 0.0030, costPer1kOutput: 0.0150 },
  { modelName: 'claude-3-5-sonnet', displayName: 'Claude 3.5 Sonnet', provider: 'Anthropic', costPer1kInput: 0.0030, costPer1kOutput: 0.0150 },
  { modelName: 'claude-sonnet-4', displayName: 'Claude Sonnet 4', provider: 'Anthropic', costPer1kInput: 0.0030, costPer1kOutput: 0.0150 },
  { modelName: 'claude-3-5-haiku', displayName: 'Claude 3.5 Haiku', provider: 'Anthropic', costPer1kInput: 0.0008, costPer1kOutput: 0.0040 },
  { modelName: 'claude-3-haiku', displayName: 'Claude 3 Haiku', provider: 'Anthropic', costPer1kInput: 0.00025, costPer1kOutput: 0.00125 },
  { modelName: 'claude-3-opus', displayName: 'Claude 3 Opus', provider: 'Anthropic', costPer1kInput: 0.0150, costPer1kOutput: 0.0750 },
  { modelName: 'default', displayName: 'Generic Model', provider: 'Other', costPer1kInput: 0.0020, costPer1kOutput: 0.0060 }
];

async function main() {
  console.log('Seeding model pricing...');
  for (const item of DEFAULT_PRICING) {
    await prisma.modelPricing.upsert({
      where: { modelName: item.modelName },
      update: item,
      create: item
    });
  }
  console.log(`Seeded ${DEFAULT_PRICING.length} model pricing entries.`);

  // Check if sample CSV exists to seed initial records
  const samplePath = path.resolve(__dirname, '../data/sample_usage.csv');
  if (fs.existsSync(samplePath)) {
    console.log('Found sample_usage.csv, seeding sample usage records...');
    const content = fs.readFileSync(samplePath, 'utf-8');
    const rows = parse(content.trim(), { columns: true, skip_empty_lines: true }) as Array<{
      customer_id: string;
      timestamp: string;
      model_name: string;
      input_tokens: string;
      output_tokens: string;
    }>;

    const pricingMap = new Map(DEFAULT_PRICING.map(p => [p.modelName, p]));

    for (const row of rows) {
      const customerId = row.customer_id.trim();
      await prisma.customer.upsert({
        where: { customerId },
        update: {},
        create: { customerId }
      });

      const inputTokens = parseInt(row.input_tokens, 10) || 0;
      const outputTokens = parseInt(row.output_tokens, 10) || 0;
      const totalTokens = inputTokens + outputTokens;
      const model = pricingMap.get(row.model_name.trim().toLowerCase()) || pricingMap.get('default')!;

      const inputCost = Number(((inputTokens / 1000) * model.costPer1kInput).toFixed(6));
      const outputCost = Number(((outputTokens / 1000) * model.costPer1kOutput).toFixed(6));
      const totalCost = Number((inputCost + outputCost).toFixed(6));

      await prisma.usageRecord.create({
        data: {
          customerId,
          timestamp: row.timestamp ? new Date(row.timestamp) : null,
          modelName: row.model_name.trim(),
          inputTokens,
          outputTokens,
          totalTokens,
          inputCost,
          outputCost,
          totalCost
        }
      });
    }
    console.log(`Seeded ${rows.length} sample usage records.`);
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
