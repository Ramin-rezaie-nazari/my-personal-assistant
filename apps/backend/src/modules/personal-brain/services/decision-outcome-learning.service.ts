import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../common/database/prisma.service';

export type DecisionOutcomeInput = {
  userId: string;
  decisionId: string;
  outcome: 'positive' | 'neutral' | 'negative';
  score?: number;
  note?: string;
  source?: 'user' | 'system' | 'behavior';
};

export type DecisionOutcomeProfile = {
  sampleSize: number;
  averageScore: number | null;
  positiveRate: number;
  negativeRate: number;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient-data';
  confidenceAdjustment: number;
};

type OutcomeRow = {
  decisionId?: string;
  outcome: string;
  score: number | null;
  createdAt: Date;
  source: string;
};

@Injectable()
export class DecisionOutcomeLearningService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: DecisionOutcomeInput) {
    const userId = input.userId.trim();
    const decisionId = input.decisionId.trim();
    if (!userId || !decisionId)
      throw new BadRequestException('userId and decisionId are required');
    if (!['positive', 'neutral', 'negative'].includes(input.outcome)) {
      throw new BadRequestException('invalid outcome');
    }

    const score = input.score === undefined ? null : Number(input.score);
    if (
      score !== null &&
      (!Number.isFinite(score) || score < -1 || score > 1)
    ) {
      throw new BadRequestException(
        'score must be a finite number between -1 and 1',
      );
    }

    const note = input.note?.trim().slice(0, 1000) || null;
    const source = input.source ?? 'user';
    const id = randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO "DecisionOutcome" ("id", "userId", "decisionId", "outcome", "score", "note", "source")
      VALUES (${id}, ${userId}, ${decisionId}, ${input.outcome}, ${score}, ${note}, ${source})
    `;
    return {
      id,
      userId,
      decisionId,
      outcome: input.outcome,
      score,
      note,
      source,
    };
  }

  async profile(
    userId: string,
    decisionId?: string,
  ): Promise<DecisionOutcomeProfile> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        outcome: string;
        score: number | null;
        createdAt: Date;
        source: string;
      }>
    >`
      SELECT "outcome", "score", "createdAt", "source"
      FROM "DecisionOutcome"
      WHERE "userId" = ${userId}
        AND (${decisionId ?? null}::text IS NULL OR "decisionId" = ${decisionId ?? null})
      ORDER BY "createdAt" DESC
      LIMIT 100
    `;

    return this.buildProfile(rows);
  }

  async decisionAdjustments(
    userId: string,
    decisionIds: string[],
  ): Promise<Record<string, number>> {
    const ids = [...new Set(decisionIds.filter(Boolean))].slice(0, 100);
    if (!ids.length) return {};

    const rows = await this.prisma.$queryRaw<OutcomeRow[]>`
      SELECT "decisionId", "outcome", "score", "createdAt", "source"
      FROM "DecisionOutcome"
      WHERE "userId" = ${userId}
        AND "decisionId" IN (${Prisma.join(ids)})
      ORDER BY "createdAt" DESC
      LIMIT 500
    `;

    const grouped = new Map<string, OutcomeRow[]>();
    for (const row of rows) {
      if (!row.decisionId) continue;
      const bucket = grouped.get(row.decisionId) ?? [];
      if (bucket.length < 20) bucket.push(row);
      grouped.set(row.decisionId, bucket);
    }

    return Object.fromEntries(
      ids.map((id) => [
        id,
        this.buildProfile(grouped.get(id) ?? []).confidenceAdjustment,
      ]),
    );
  }

  private buildProfile(
    rows: Array<{
      outcome: string;
      score: number | null;
      createdAt: Date;
      source: string;
    }>,
  ): DecisionOutcomeProfile {
    if (rows.length < 3) {
      return {
        sampleSize: rows.length,
        averageScore: this.average(rows),
        positiveRate: this.rate(rows, 'positive'),
        negativeRate: this.rate(rows, 'negative'),
        trend: 'insufficient-data',
        confidenceAdjustment: 0,
      };
    }

    const recent = rows.slice(0, Math.ceil(rows.length / 3));
    const older = rows.slice(-Math.ceil(rows.length / 3));
    const recentScore = this.average(recent);
    const olderScore = this.average(older);
    const delta =
      recentScore != null && olderScore != null ? recentScore - olderScore : 0;
    const trend =
      delta > 0.08 ? 'improving' : delta < -0.08 ? 'declining' : 'stable';
    const qualityRows = rows.filter((row) => row.source !== 'system');
    const qualityPositiveRate = this.rate(qualityRows, 'positive');
    const qualityNegativeRate = this.rate(qualityRows, 'negative');
    const positiveRate = this.rate(rows, 'positive');
    const negativeRate = this.rate(rows, 'negative');

    let confidenceAdjustment = 0;
    if (
      qualityRows.length >= 5 &&
      qualityPositiveRate >= 0.7 &&
      trend !== 'declining'
    )
      confidenceAdjustment = 0.04;
    if (
      qualityRows.length >= 5 &&
      qualityNegativeRate >= 0.7 &&
      trend !== 'improving'
    )
      confidenceAdjustment = -0.04;

    return {
      sampleSize: rows.length,
      averageScore: this.average(rows),
      positiveRate,
      negativeRate,
      trend,
      confidenceAdjustment,
    };
  }

  private average(rows: Array<{ score: number | null }>) {
    const scores = rows
      .map((row) => row.score)
      .filter(
        (score): score is number =>
          typeof score === 'number' && Number.isFinite(score),
      );
    return scores.length
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;
  }

  private rate(rows: Array<{ outcome: string }>, outcome: string) {
    return rows.length
      ? rows.filter((row) => row.outcome === outcome).length / rows.length
      : 0;
  }
}
