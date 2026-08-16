import { DailyService } from './daily.service';

describe('DailyService', () => {
  const prisma = {
    dailyLog: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  let service: DailyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DailyService(prisma as never);
  });

  it('reads a requested calendar day', async () => {
    prisma.dailyLog.findUnique.mockResolvedValue(null);

    await service.getDailyLog('user-1', '2026-08-11');

    expect(prisma.dailyLog.findUnique).toHaveBeenCalledWith({
      where: {
        userId_dateKey: {
          userId: 'user-1',
          dateKey: '2026-08-11',
        },
      },
    });
  });

  it('defaults updates to today and uses the composite key', async () => {
    prisma.dailyLog.upsert.mockResolvedValue({});

    await service.updateDailyLog('user-1', { waterMl: 500 });

    const call = prisma.dailyLog.upsert.mock.calls[0][0];
    expect(call.where.userId_dateKey.userId).toBe('user-1');
    expect(call.where.userId_dateKey.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(call.create).toEqual({
      userId: 'user-1',
      dateKey: call.where.userId_dateKey.dateKey,
      waterMl: 500,
    });
  });

  it('adds water atomically to a requested day', async () => {
    prisma.dailyLog.upsert.mockResolvedValue({ waterMl: 1250 });

    await service.addWater('user-1', 250, '2026-08-11');

    expect(prisma.dailyLog.upsert).toHaveBeenCalledWith({
      where: {
        userId_dateKey: {
          userId: 'user-1',
          dateKey: '2026-08-11',
        },
      },
      update: { waterMl: { increment: 250 } },
      create: { userId: 'user-1', dateKey: '2026-08-11', waterMl: 250 },
    });
  });

  it('rejects invalid water quick-log amounts', async () => {
    await expect(service.addWater('user-1', 0, '2026-08-11')).rejects.toThrow(
      'amountMl must be between 1 and 5000',
    );
    await expect(
      service.addWater('user-1', 6000, '2026-08-11'),
    ).rejects.toThrow('amountMl must be between 1 and 5000');
  });

  it('rejects malformed date keys', async () => {
    await expect(service.getDailyLog('user-1', '11-08-2026')).rejects.toThrow(
      'dateKey must use YYYY-MM-DD format',
    );
  });

  it('rejects impossible calendar dates', async () => {
    await expect(service.getDailyLog('user-1', '2026-02-31')).rejects.toThrow(
      'dateKey must be a valid calendar date',
    );
  });
});
