import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../common/database/prisma.service';

export type DecisionOutcomeInput = {
  userId: string;
  decisionId: string;
  outcome: 'positive' | 'neutral' | 'negative';
  score?: number;
  note?: string;
};

export type DecisionOutcomeProfile = {
  sampleSize: number;
  averageScore: number | null;
  positiveRate: number;
  negativeRate: number;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient-data';
  confidenceAdjustment: number;
};

@Injectable()
export class DecisionOutcomeLearningService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: DecisionOutcomeInput) {
    const id = randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO "DecisionOutcome" ("id", "userId", "decisionId", "outcome", "score", "note")
      VALUES (${id}, ${input.userId}, ${input.decisionId}, ${input.outcome}, ${input.score ?? null}, ${input.note ?? null})
    `;
    return { id, ...input };
  }

  async profile(userId: string, decisionId?: string): Promise<DecisionOutcomeProfile> {
    const rows = await this.prisma.$queryRaw<Array<{ outcome: string; score: number | null; createdAt: Date }>>`
      SELECT "outcome", "score", "createdAt"
      FROM "DecisionOutcome"
      WHERE "userId" = ${userId}
        AND (${decisionId ?? null}::text IS NULL OR "decisionId" = ${decisionId ?? null})
      ORDER BY "createdAt" DESC
      LIMIT 100
    `;

    if (rows.length < 3) {
      return { sampleSize: rows.length, averageScore: this.average(rows), positiveRate: this.rate(rows, 'positive'), negativeRate: this.rate(rows, 'negative'), trend: 'insufficient-data', confidenceAdjustment: 0 };
    }

    const recent = rows.slice(0, Math.ceil(rows.length / 3));
    const older = rows.slice(-Math.ceil(rows.length / 3));
    const recentScore = this.average(recent);
    const olderScore = this.average(older);
    const delta = recentScore != null && olderScore != null ? recentScore - olderScore : 0;
    const trend = delta > 0.08 ? 'improving' : delta < -0.08 ? 'declining' : 'stable';
    const positiveRate = this.rate(rows, 'positive');
    const negativeRate = this.rate(rows, 'negative');

    let confidenceAdjustment = 0;
    if (rows.length >= 5 && positiveRate >= 0.7 && trend !== 'declining') confidenceAdjustment = 0.04;
    if (rows.length >= 5 && negativeRate >= 0.7 && trend !== 'improving') confidenceAdjustment = -0.04;

    return { sampleSize: rows.length, averageScore: this.average(rows), positiveRate, negativeRate, trend, confidenceAdjustment };
  }

  private average(rows: Array<{ score: number | null }>) {
    const scores = rows.map((row) => row.score).filter((score): score is number => typeof score === 'number' && Number.isFinite(score));
    return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
  }

  private rate(rows: Array<{ outcome: string }>, outcome: string) {
    return rows.length ? rows.filter((row) => row.outcome === outcome).length / rows.length : 0;
  }
}
