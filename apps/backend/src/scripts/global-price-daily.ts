import { GlobalCountryFinanceService } from '../modules/budget-intelligence/services/global-country-finance.service';
import { GlobalPriceCollectionService } from '../modules/price-intelligence/services/global-price-collection.service';
import { OpenPricesSourceAdapter } from '../modules/price-intelligence/services/open-prices-source.adapter';
import { PricePersistenceService } from '../modules/price-intelligence/services/price-persistence.service';
import { PrismaService } from '../common/database/prisma.service';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for global price collection');
  const prisma = new PrismaService();
  await prisma.onModuleInit();
  try {
    const service = new GlobalPriceCollectionService(
      new PricePersistenceService(prisma),
      new GlobalCountryFinanceService(),
      new OpenPricesSourceAdapter(),
    );
    const result = await service.collect();
    console.log(JSON.stringify(result, null, 2));
    if (result.status === 'failed' || result.accepted === 0) process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});