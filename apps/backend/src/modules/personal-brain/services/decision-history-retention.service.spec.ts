import { PrismaService } from '../../../common/database/prisma.service';
import { DecisionHistoryRetentionService } from './decision-history-retention.service';

describe('DecisionHistoryRetentionService', () => {
  const prisma = {
    userFact: {
      findFirst: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback(prisma)),
  } as unknown as PrismaService;
  const service = new DecisionHistoryRetentionService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.userFact.findFirst.mockResolvedValue(null);
    prisma.userFact.deleteMany.mockResolvedValue({ count: 0 });
    prisma.userFact.create.mockResolvedValue({});
  });

  it('uses a restart-stable configured retention policy', async () => {
    const now = Date.UTC(2026, 7, 12);
    const cutoff = await service.cutoff('u1', now);
    expect(cutoff).toBeLessThan(now);
    expect((await service.getPolicy('u1')).retention).toBe('3_months');
  });

  it('persists finite and unlimited retention policy values', async () => {
    expect((await service.setPolicy('u1', { retention: 'unlimited' })).retention).toBe('unlimited');
    expect(prisma.userFact.create).toHaveBeenCalled();
    expect((await service.setPolicy('u1', { retention: '1_month' })).retention).toBe('1_month');
    expect((await service.setPolicy('u1', { retention: '3_months' })).retention).toBe('3_months');
  });

  it('clamps recent-delete hours to a safe range', async () => {
    expect(
      (await service.setPolicy('u1', {
        retention: '3_months',
        deleteRecentActivityHours: 99999,
      })).deleteRecentActivityHours,
    ).toBe(8760);
  });
});
