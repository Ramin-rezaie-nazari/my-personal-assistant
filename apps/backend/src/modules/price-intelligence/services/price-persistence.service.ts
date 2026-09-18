import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../../../common/database/prisma.service';
import { NormalizedPrice } from '../models/price-intelligence.model';

@Injectable()
export class PricePersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureTrackedProducts() {
    const foods = await this.prisma.$queryRaw<
      Array<{ id: string; name: string }>
    >`SELECT id, name FROM "FoodItem" WHERE "userId" IS NULL ORDER BY "createdAt" ASC`;
    for (const food of foods) {
      const productKey = this.normalizeKey(food.name);
      await this.prisma
        .$executeRaw`INSERT INTO "PriceTrackedProduct" ("id","productKey","name") VALUES (${randomUUID()},${productKey},${food.name}) ON CONFLICT ("productKey") DO NOTHING`;
    }
    return foods.length;
  }

  async trackedProductKeys() {
    const rows = await this.prisma.$queryRaw<
      Array<{ productKey: string }>
    >`SELECT "productKey" FROM "PriceTrackedProduct" WHERE "active" = true ORDER BY "productKey"`;
    return rows.map((row) => row.productKey);
  }

  async record(prices: NormalizedPrice[]) {
    let written = 0;
    for (const price of prices) {
      await this.prisma
        .$executeRaw`INSERT INTO "PriceTrackedProduct" ("id","productKey","name") VALUES (${randomUUID()},${price.productKey},${price.title}) ON CONFLICT ("productKey") DO UPDATE SET "name"=EXCLUDED."name","updatedAt"=CURRENT_TIMESTAMP`;
      const identity = [
        price.productKey,
        price.sourceId,
        price.countryCode ?? '',
        price.city ?? '',
        price.url ?? '',
        price.observedAt.toISOString(),
        price.amount,
        price.currency,
        price.title,
      ].join('|');
      const id = createHash('sha256').update(identity).digest('hex');
      const inserted = await this.prisma
        .$executeRaw`INSERT INTO "PriceSnapshot" ("id","productKey","sourceId","countryCode","title","url","currency","amount","unit","unitPrice","city","availability","observedAt") VALUES (${id},${price.productKey},${price.sourceId},${price.countryCode ?? null},${price.title},${price.url ?? null},${price.currency},${price.amount},${price.unit ?? null},${price.unitPrice ?? null},${price.city ?? null},${price.availability ?? 'unknown'},${price.observedAt}) ON CONFLICT ("id") DO NOTHING`;
      written += Number(inserted > 0);
    }
    return written;
  }

  async latest(productKey?: string, countryCode?: string) {
    if (productKey && countryCode)
      return this.prisma
        .$queryRaw`SELECT DISTINCT ON ("sourceId") * FROM "PriceSnapshot" WHERE "productKey"=${productKey} AND "countryCode"=${countryCode} ORDER BY "sourceId", "observedAt" DESC`;
    if (productKey)
      return this.prisma
        .$queryRaw`SELECT DISTINCT ON ("sourceId") * FROM "PriceSnapshot" WHERE "productKey"=${productKey} ORDER BY "sourceId", "observedAt" DESC`;
    if (countryCode)
      return this.prisma
        .$queryRaw`SELECT DISTINCT ON ("productKey","sourceId") * FROM "PriceSnapshot" WHERE "countryCode"=${countryCode} ORDER BY "productKey","sourceId","observedAt" DESC`;
    return this.prisma
      .$queryRaw`SELECT DISTINCT ON ("productKey","sourceId") * FROM "PriceSnapshot" ORDER BY "productKey","sourceId","observedAt" DESC`;
  }

  async history(productKey: string, from?: Date, to?: Date, sourceId?: string, countryCode?: string) {
    const start = from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = to ?? new Date();
    if (sourceId && countryCode)
      return this.prisma
        .$queryRaw`SELECT * FROM "PriceSnapshot" WHERE "productKey"=${productKey} AND "sourceId"=${sourceId} AND "countryCode"=${countryCode} AND "observedAt" BETWEEN ${start} AND ${end} ORDER BY "observedAt" ASC`;
    if (sourceId)
      return this.prisma
        .$queryRaw`SELECT * FROM "PriceSnapshot" WHERE "productKey"=${productKey} AND "sourceId"=${sourceId} AND "observedAt" BETWEEN ${start} AND ${end} ORDER BY "observedAt" ASC`;
    if (countryCode)
      return this.prisma
        .$queryRaw`SELECT * FROM "PriceSnapshot" WHERE "productKey"=${productKey} AND "countryCode"=${countryCode} AND "observedAt" BETWEEN ${start} AND ${end} ORDER BY "observedAt" ASC`;
    return this.prisma
      .$queryRaw`SELECT * FROM "PriceSnapshot" WHERE "productKey"=${productKey} AND "observedAt" BETWEEN ${start} AND ${end} ORDER BY "observedAt" ASC`;
  }

  async sources() {
    return this.prisma
      .$queryRaw`SELECT id,name,kind,"baseUrl",enabled,"adapterId",scope,"collectionMode",license FROM "PriceSource" ORDER BY name`;
  }

  async createRun(scheduledFor: Date, startedAt: Date, scope = 'local', sourceId?: string) {
    const id = `${scope}:${sourceId ?? 'default'}:${scheduledFor.toISOString()}`;
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "PriceCollectionRun" ("id","scheduledFor","startedAt","status","scope","sourceId")
      VALUES (${id},${scheduledFor},${startedAt},'running',${scope},${sourceId ?? null})
      ON CONFLICT ("scheduledFor") DO UPDATE
      SET "startedAt"=EXCLUDED."startedAt",
          "completedAt"=NULL,
          "status"='running',
          "attempts"=0,
          "collected"=0,
          "failedSources"='[]'::jsonb,
          "attemptedSources"='[]'::jsonb,
          "error"=NULL,
          "scope"=EXCLUDED."scope",
          "sourceId"=EXCLUDED."sourceId"
      WHERE "PriceCollectionRun"."status" IN ('failed','partial')
      RETURNING "id"`;
    return { id, acquired: rows.length === 1 };
  }

  async finishRun(
    id: string,
    result: {
      status: string;
      attempts: number;
      collected: number;
      failedSources: string[];
      attemptedSources: string[];
      error?: string;
    },
  ) {
    await this.prisma
      .$executeRaw`UPDATE "PriceCollectionRun" SET "completedAt"=${new Date()},"status"=${result.status},"attempts"=${result.attempts},"collected"=${result.collected},"failedSources"=${JSON.stringify(result.failedSources)}::jsonb,"attemptedSources"=${JSON.stringify(result.attemptedSources)}::jsonb,"error"=${result.error ?? null} WHERE "id"=${id}`;
  }

  async latestSuccessfulRun(scope = 'local', sourceId?: string) {
    if (sourceId) {
      const rows = await this.prisma.$queryRaw<Array<{ completedAt: Date | null }>>`SELECT "completedAt" FROM "PriceCollectionRun" WHERE "status" IN ('completed','partial') AND "scope"=${scope} AND "sourceId"=${sourceId} ORDER BY "completedAt" DESC LIMIT 1`;
      return rows[0]?.completedAt;
    }
    const rows = await this.prisma.$queryRaw<Array<{ completedAt: Date | null }>>`SELECT "completedAt" FROM "PriceCollectionRun" WHERE "status" IN ('completed','partial') AND "scope"=${scope} ORDER BY "completedAt" DESC LIMIT 1`;
    return rows[0]?.completedAt;
  }

  async upsertCoverage(
    sourceId: string,
    countryCode: string,
    lastObservedAt: Date | null,
    observationCount: number,
  ) {
    const id = `${sourceId}:${countryCode}`;
    return this.prisma.$executeRaw`
      INSERT INTO "PriceCoverageSnapshot"
        ("id","countryCode","sourceId","lastObservedAt","lastCollectedAt","observationCount","status")
      VALUES (
        ${id},
        ${countryCode},
        ${sourceId},
        ${lastObservedAt},
        CURRENT_TIMESTAMP,
        ${Math.max(0, observationCount)},
        CASE
          WHEN ${lastObservedAt} IS NULL THEN 'missing'
          WHEN ${lastObservedAt}::date = CURRENT_DATE THEN 'fresh'
          ELSE 'stale'
        END
      )
      ON CONFLICT ("sourceId","countryCode") DO UPDATE
      SET
        "lastObservedAt" = GREATEST("PriceCoverageSnapshot"."lastObservedAt", EXCLUDED."lastObservedAt"),
        "lastCollectedAt" = CURRENT_TIMESTAMP,
        "observationCount" = EXCLUDED."observationCount",
        "updatedAt" = CURRENT_TIMESTAMP,
        "status" = CASE
          WHEN GREATEST("PriceCoverageSnapshot"."lastObservedAt", EXCLUDED."lastObservedAt") IS NULL THEN 'missing'
          WHEN GREATEST("PriceCoverageSnapshot"."lastObservedAt", EXCLUDED."lastObservedAt")::date = CURRENT_DATE THEN 'fresh'
          ELSE 'stale'
        END`;
  }

  async coverage(sourceId = 'open-prices') {
    return this.prisma.$queryRaw`
      SELECT "countryCode","sourceId","lastObservedAt","lastCollectedAt","observationCount","status","updatedAt"
      FROM "PriceCoverageSnapshot"
      WHERE "sourceId"=${sourceId}
      ORDER BY "countryCode"`;
  }

  private normalizeKey(value: string) {
    return value
      .trim()
      .toLocaleLowerCase('fa-IR')
      .replace(/[\u200c\s]+/g, '-')
      .replace(/[^\p{L}\p{N}-]+/gu, '')
      .slice(0, 180);
  }
}