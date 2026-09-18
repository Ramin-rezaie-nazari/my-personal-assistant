import { PrismaService } from '../common/database/prisma.service';
import { NightlyMarketIntelligenceService } from '../modules/price-intelligence/services/nightly-market-intelligence.service';
import { PriceCoverageService } from '../modules/price-intelligence/services/price-coverage.service';
import { PricePersistenceService } from '../modules/price-intelligence/services/price-persistence.service';
import { PriceSourceService } from '../modules/price-intelligence/services/price-source.service';
import { PriceSourceRegistryService } from '../modules/price-intelligence/services/price-source-registry.service';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for global daily price collection');
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  try {
    const persistence = new PricePersistenceService(prisma);
    const registry = new PriceSourceRegistryService();
    const sources = new PriceSourceService(registry);
    const nightly = new NightlyMarketIntelligenceService(sources, persistence);
    const scheduledFor = new Date();

    // Open Prices is a public global observation stream and does not require tracked product keys.
    const result = await nightly.run(['__global_daily__'], ['open-prices'], scheduledFor);
    const coverage = await new PriceCoverageService(prisma).getCoverage(1, 'open-prices');

    const summary = {
      ...result,
      coverage: {
        totalCountries: coverage.totalCountries,
        freshToday: coverage.countriesFresh,
        stale: coverage.countriesStale,
        noData: coverage.countriesWithoutData,
        dataCountries: coverage.countriesWithData,
      },
    };
    console.log(JSON.stringify(summary, null, 2));

    // A reachable provider with zero accepted observations is treated as a failed run.
    if (result.status === 'failed' || result.collected === 0) process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});