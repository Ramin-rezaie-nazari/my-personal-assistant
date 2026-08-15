import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../common/database/prisma.service';
import { NormalizedPrice } from '../models/price-intelligence.model';

@Injectable()
export class PricePersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureTrackedProducts() {
    const foods = await this.prisma.$queryRaw<Array<{ id: string; name: string }>>`SELECT id, name FROM "FoodItem" WHERE "userId" IS NULL ORDER BY "createdAt" ASC`;
    for (const food of foods) {
      const productKey = this.normalizeKey(food.name);
      await this.prisma.$executeRaw`INSERT INTO "PriceTrackedProduct" ("id","productKey","name") VALUES (${randomUUID()},${productKey},${food.name}) ON CONFLICT ("productKey") DO NOTHING`;
    }
    return foods.length;
  }

  async trackedProductKeys() {
    const rows = await this.prisma.$queryRaw<Array<{ productKey: string }>>`SELECT "productKey" FROM "PriceTrackedProduct" WHERE "active" = true ORDER BY "productKey"`;
    return rows.map((row) => row.productKey);
  }

  async record(prices: NormalizedPrice[]) {
    let written = 0;
    for (const price of prices) {
      await this.prisma.$executeRaw`INSERT INTO "PriceTrackedProduct" ("id","productKey","name","city") VALUES (${randomUUID()},${price.productKey},${price.title},${price.city ?? null}) ON CONFLICT ("productKey") DO UPDATE SET "updatedAt"=CURRENT_TIMESTAMP`;
      const id = `${price.productKey}:${price.sourceId}:${price.observedAt.getTime()}`;
      await this.prisma.$executeRaw`INSERT INTO "PriceSnapshot" ("id","productKey","sourceId","title","url","currency","amount","unit","unitPrice","city","availability","observedAt") VALUES (${id},${price.productKey},${price.sourceId},${price.title},${price.url ?? null},${price.currency},${price.amount},${price.unit ?? null},${price.unitPrice ?? null},${price.city ?? null},${price.availability ?? 'unknown'},${price.observedAt}) ON CONFLICT ("id") DO NOTHING`;
      written += 1;
    }
    return written;
  }

  async latest(productKey?: string) {
    if (productKey) return this.prisma.$queryRaw`SELECT DISTINCT ON ("sourceId") * FROM "PriceSnapshot" WHERE "productKey"=${productKey} ORDER BY "sourceId", "observedAt" DESC`;
    return this.prisma.$queryRaw`SELECT DISTINCT ON ("productKey","sourceId") * FROM "PriceSnapshot" ORDER BY "productKey","sourceId","observedAt" DESC`;
  }

  async history(productKey: string, from?: Date, to?: Date, sourceId?: string) {
    const start = from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = to ?? new Date();
    if (sourceId) return this.prisma.$queryRaw`SELECT * FROM "PriceSnapshot" WHERE "productKey"=${productKey} AND "sourceId"=${sourceId} AND "observedAt" BETWEEN ${start} AND ${end} ORDER BY "observedAt" ASC`;
    return this.prisma.$queryRaw`SELECT * FROM "PriceSnapshot" WHERE "productKey"=${productKey} AND "observedAt" BETWEEN ${start} AND ${end} ORDER BY "observedAt" ASC`;
  }

  async sources() { return this.prisma.$queryRaw`SELECT id,name,kind,"baseUrl",enabled,"adapterId" FROM "PriceSource" ORDER BY name`; }

  async createRun(scheduledFor: Date, startedAt: Date) {
    const id = `market:${scheduledFor.toISOString()}`;
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`INSERT INTO "PriceCollectionRun" ("id","scheduledFor","startedAt","status") VALUES (${id},${scheduledFor},${startedAt},'running') ON CONFLICT ("scheduledFor") DO NOTHING RETURNING "id"`;
    return { id, acquired: rows.length === 1 };
  }

  async finishRun(id: string, result: { status: string; attempts: number; collected: number; failedSources: string[]; attemptedSources: string[]; error?: string }) {
    await this.prisma.$executeRaw`UPDATE "PriceCollectionRun" SET "completedAt"=${new Date()},"status"=${result.status},"attempts"=${result.attempts},"collected"=${result.collected},"failedSources"=${JSON.stringify(result.failedSources)}::jsonb,"attemptedSources"=${JSON.stringify(result.attemptedSources)}::jsonb,"error"=${result.error ?? null} WHERE "id"=${id}`;
  }

  async latestSuccessfulRun() {
    const rows = await this.prisma.$queryRaw<Array<{ completedAt: Date | null }>>`SELECT "completedAt" FROM "PriceCollectionRun" WHERE "status" IN ('completed','partial') ORDER BY "completedAt" DESC LIMIT 1`;
    return rows[0]?.completedAt;
  }

  private normalizeKey(value: string) { return value.trim().toLocaleLowerCase('fa-IR').replace(/[\u200c\s]+/g, '-').replace(/[^\p{L}\p{N}-]+/gu, '').slice(0, 180); }
}
