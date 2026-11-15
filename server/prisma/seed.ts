import { db, checkConnection } from '../src/db.js';
import { ensurePricingSeeded } from '../src/services/pricingService.js';

async function main() {
  await checkConnection();
  const scheduledModels = await ensurePricingSeeded();
  console.log('Seeded shared model display metadata and price versions idempotently.');
  console.log(`Scheduled 2027-01-01 global rate change for: ${scheduledModels.join(', ') || 'none'}.`);
}

main()
  .catch(error => {
    console.error('Error during seeding:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
