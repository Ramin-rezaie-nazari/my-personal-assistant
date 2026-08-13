import { DecisionOutcomeLearningService } from './decision-outcome-learning.service';

describe('DecisionOutcomeLearningService', () => {
  it('requires enough evidence before learning', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        { outcome: 'positive', score: 0.9, createdAt: new Date() },
        { outcome: 'positive', score: 0.8, createdAt: new Date() },
      ]),
    } as any;
    const service = new DecisionOutcomeLearningService(prisma);
    const profile = await service.profile('user-1');
    expect(profile.trend).toBe('insufficient-data');
    expect(profile.confidenceAdjustment).toBe(0);
  });

  it('learns a positive stable outcome pattern', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue(Array.from({ length: 6 }, (_, index) => ({
        outcome: 'positive', score: 0.9, createdAt: new Date(Date.now() - index * 1000),
      })),
    } as any;
    const service = new DecisionOutcomeLearningService(prisma);
    const profile = await service.profile('user-1');
    expect(profile.positiveRate).toBe(1);
    expect(profile.confidenceAdjustment).toBe(0.04);
  });

  it('learns a negative stable outcome pattern', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue(Array.from({ length: 6 }, (_, index) => ({
        outcome: 'negative', score: 0.2, createdAt: new Date(Date.now() - index * 1000),
      })),
    } as any;
    const service = new DecisionOutcomeLearningService(prisma);
    const profile = await service.profile('user-1');
    expect(profile.negativeRate).toBe(1);
    expect(profile.confidenceAdjustment).toBe(-0.04);
  });
});
