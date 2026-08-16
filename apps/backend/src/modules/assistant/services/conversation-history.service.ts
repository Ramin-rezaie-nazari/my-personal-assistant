import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../common/database/prisma.service';

export type PersistedConversationTurn = {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
  intent?: string;
  action?: string;
  executionId?: string;
  resourceType?: string;
  resourceId?: string;
};

@Injectable()
export class ConversationHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async append(
    input: Omit<PersistedConversationTurn, 'id' | 'createdAt'>,
  ): Promise<PersistedConversationTurn> {
    const text = input.text.trim();
    if (!text) throw new Error('Conversation turn text cannot be empty');
    if (text.length > 12000)
      throw new Error('Conversation turn text is too long');
    if (input.role !== 'user' && input.role !== 'assistant')
      throw new Error('Invalid conversation role');

    const id = randomUUID();
    const createdAt = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO "ConversationTurn" ("id","userId","role","text","intent","action","executionId","resourceType","resourceId","createdAt")
      VALUES (${id},${input.userId},${input.role},${text},${input.intent ?? null},${input.action ?? null},${input.executionId ?? null},${input.resourceType ?? null},${input.resourceId ?? null},${createdAt})
    `;

    return { ...input, id, text, createdAt: createdAt.getTime() };
  }

  async getRecent(
    userId: string,
    limit = 24,
  ): Promise<PersistedConversationTurn[]> {
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        userId: string;
        role: 'user' | 'assistant';
        text: string;
        intent: string | null;
        action: string | null;
        executionId: string | null;
        resourceType: string | null;
        resourceId: string | null;
        createdAt: Date;
      }>
    >`
      SELECT "id","userId","role","text","intent","action","executionId","resourceType","resourceId","createdAt"
      FROM "ConversationTurn"
      WHERE "userId"=${userId}
      ORDER BY "createdAt" DESC
      LIMIT ${safeLimit}
    `;

    return rows.reverse().map((row) => ({
      id: row.id,
      userId: row.userId,
      role: row.role,
      text: row.text,
      intent: row.intent ?? undefined,
      action: row.action ?? undefined,
      executionId: row.executionId ?? undefined,
      resourceType: row.resourceType ?? undefined,
      resourceId: row.resourceId ?? undefined,
      createdAt: row.createdAt.getTime(),
    }));
  }

  async getLatestAction(
    userId: string,
  ): Promise<PersistedConversationTurn | undefined> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        userId: string;
        role: 'user' | 'assistant';
        text: string;
        intent: string | null;
        action: string | null;
        executionId: string | null;
        resourceType: string | null;
        resourceId: string | null;
        createdAt: Date;
      }>
    >`
      SELECT "id","userId","role","text","intent","action","executionId","resourceType","resourceId","createdAt"
      FROM "ConversationTurn"
      WHERE "userId"=${userId} AND ("action" IS NOT NULL OR "executionId" IS NOT NULL OR "resourceId" IS NOT NULL)
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      userId: row.userId,
      role: row.role,
      text: row.text,
      intent: row.intent ?? undefined,
      action: row.action ?? undefined,
      executionId: row.executionId ?? undefined,
      resourceType: row.resourceType ?? undefined,
      resourceId: row.resourceId ?? undefined,
      createdAt: row.createdAt.getTime(),
    };
  }

  async deleteAll(userId: string) {
    const result = await this.prisma
      .$executeRaw`DELETE FROM "ConversationTurn" WHERE "userId"=${userId}`;
    return { deleted: Number(result) };
  }

  async deleteSince(userId: string, since: Date) {
    const result = await this.prisma
      .$executeRaw`DELETE FROM "ConversationTurn" WHERE "userId"=${userId} AND "createdAt">=${since}`;
    return { deleted: Number(result) };
  }
}
