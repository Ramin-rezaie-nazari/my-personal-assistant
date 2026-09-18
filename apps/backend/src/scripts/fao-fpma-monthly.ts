import { PrismaService } from '../common/database/prisma.service';
import { NightlyMarketIntelligenceService } from '../modules/price-intelligence/services/nightly-market-intelligence.service';
import { PricePersistenceService } from '../modules/price-intelligence/services/price-persistence.service';
import { PriceSourceService } from '../modules/price-intelligence/services/price-source.service';
import { PriceSourceRegistryService } from '../modules/price-intelligence/services/price-source-registry.service';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for FPMA collection');
  const prisma = new PrismaService();
  await prisma.onModuleInit();
  try {
    const persistence = new PricePersistenceService(prisma);
    const sources = new PriceSourceService(new PriceSourceRegistryService());
    const nightly = new NightlyMarketIntelligenceService(sources, persistence);
    const result = await nightly.run(['__fpma_monthly__'], ['fao-fpma'], new Date());
    console.log(JSON.stringify(result, null, 2));
    if (result.status === 'failed' || result.collected === 0) process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});