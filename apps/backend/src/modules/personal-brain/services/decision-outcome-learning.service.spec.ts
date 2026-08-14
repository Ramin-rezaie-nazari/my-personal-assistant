import { BadRequestException } from '@nestjs/common';
import { DecisionOutcomeLearningService } from './decision-outcome-learning.service';

describe('DecisionOutcomeLearningService', () => {
  it('requires enough evidence before learning', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([
      { outcome: 'positive', score: 0.9, createdAt: new Date(), source: 'user' },
      { outcome: 'positive', score: 0.8, createdAt: new Date(), source: 'user' },
    ]) } as any;
    const service = new DecisionOutcomeLearningService(prisma);
    const profile = await service.profile('user-1');
    expect(profile.trend).toBe('insufficient-data');
    expect(profile.confidenceAdjustment).toBe(0);
  });

  it('learns a positive stable outcome pattern', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue(Array.from({ length: 6 }, (_, index) => ({
      outcome: 'positive', score: 0.9, createdAt: new Date(Date.now() - index * 1000), source: 'user',
    }))) } as any;
    const service = new DecisionOutcomeLearningService(prisma);
    const profile = await service.profile('user-1');
    expect(profile.positiveRate).toBe(1);
    expect(profile.confidenceAdjustment).toBe(0.04);
  });

  it('learns a negative stable outcome pattern', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue(Array.from({ length: 6 }, (_, index) => ({
      outcome: 'negative', score: 0.2, createdAt: new Date(Date.now() - index * 1000), source: 'user',
    }))) } as any;
    const service = new DecisionOutcomeLearningService(prisma);
    const profile = await service.profile('user-1');
    expect(profile.negativeRate).toBe(1);
    expect(profile.confidenceAdjustment).toBe(-0.04);
  });

  it('returns bounded per-decision adjustments for candidate ranking', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([
      ...Array.from({ length: 6 }, (_, index) => ({ decisionId: 'task-good', outcome: 'positive', score: 0.9, createdAt: new Date(Date.now() - index * 1000), source: 'user' })),
      ...Array.from({ length: 6 }, (_, index) => ({ decisionId: 'task-bad', outcome: 'negative', score: 0.2, createdAt: new Date(Date.now() - index * 1000), source: 'user' })),
    ]) } as any;
    const service = new DecisionOutcomeLearningService(prisma);
    const adjustments = await service.decisionAdjustments('user-1', ['task-good', 'task-bad', 'task-new']);
    expect(adjustments['task-good']).toBe(0.04);
    expect(adjustments['task-bad']).toBe(-0.04);
    expect(adjustments['task-new']).toBe(0);
    expect(Object.values(adjustments).every((value) => value >= -0.04 && value <= 0.04)).toBe(true);
  });

  it('rejects invalid feedback before writing', async () => {
    const prisma = { $executeRaw: jest.fn() } as any;
    const service = new DecisionOutcomeLearningService(prisma);
    await expect(service.record({ userId: 'user-1', decisionId: 'task-1', outcome: 'positive', score: 2 } as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('normalizes valid user feedback deterministically', async () => {
    const prisma = { $executeRaw: jest.fn().mockResolvedValue(1) } as any;
    const service = new DecisionOutcomeLearningService(prisma);
    const result = await service.record({
      userId: ' user-1 ', decisionId: ' task-1 ', outcome: 'positive', score: 0.75, note: '  useful suggestion  ', source: 'user',
    });
    expect(result.userId).toBe('user-1');
    expect(result.decisionId).toBe('task-1');
    expect(result.score).toBe(0.75);
    expect(result.note).toBe('useful suggestion');
    expect(result.source).toBe('user');
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
