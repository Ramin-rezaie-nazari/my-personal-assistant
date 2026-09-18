import { PrismaService } from '../common/database/prisma.service';
import { NightlyMarketIntelligenceService } from '../modules/price-intelligence/services/nightly-market-intelligence.service';
import { PricePersistenceService } from '../modules/price-intelligence/services/price-persistence.service';
import { PriceSourceRegistryService } from '../modules/price-intelligence/services/price-source-registry.service';
import { PriceSourceService } from '../modules/price-intelligence/services/price-source.service';

function localScheduledFor(hour: number, minute: number, now = new Date()) {
  const scheduled = new Date(now);
  scheduled.setHours(hour, minute, 0, 0);
  if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1);
  return scheduled;
}

function configNumber(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(1_000, ms)));
}

async function runOnce(scheduledFor: Date) {
  if (!process.env.DATABASE_URL)
    throw new Error('DATABASE_URL is required for local price scheduling');

  const prisma = new PrismaService();
  await prisma.onModuleInit();
  try {
    const persistence = new PricePersistenceService(prisma);
    const sources = new PriceSourceService(new PriceSourceRegistryService());
    const nightly = new NightlyMarketIntelligenceService(sources, persistence);
    const result = await nightly.run(
      ['__global_daily__'],
      ['open-prices'],
      scheduledFor,
    );
    console.log(JSON.stringify({
      kind: 'm ypa.price.daily'.replace(' ',''),
      scheduledFor,
      runId: result.runId,
      status: result.status,
      collected: result.collected,
      failedSources: result.failedSources,
      attemptedSources: result.attemptedSources,
    }));
    if (result.status === 'failed' || result.collected === 0)
      throw new Error('global_daily_price_run_failed:' + result.runId);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const hour = configNumber('LOCAL_PRICE_DAILY_HOUR', 3, 0, 23);
  const minute = configNumber('LOCAL_PRICE_DAILY_MINUTE', 30, 0, 59);
  const runImmediately = /^(1|true|yes)$/i.test(
    process.env.LOCAL_PRICE_RUN_IMMEDIATELY ?? 'false',
  );

  if (runImmediately) {
    try { await runOnce(new Date()); }
    catch (error) { console.error(error); }
  }

  while (true) {
    const next = localScheduledFor(hour, minute);
    console.log(JSON.stringify({
      kind: 'm ypa.price.scheduler'.replace(' ',''),
      nextRunAt: next,
      localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hour,
      minute,
    }));
    await sleep(next.getTime() - Date.now());
    try {
      await runOnce(next);
    } catch (error) {
      console.error(error);
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});