import { SupplementsService } from './supplements.service';

describe('SupplementsService', () => {
  const prisma = {
    supplement: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
    supplementLog: { upsert: jest.fn() },
  };
  let service: SupplementsService;

  beforeEach(() => { jest.clearAllMocks(); service = new SupplementsService(prisma as never); });

  it('creates a user-scoped supplement with a default schedule', async () => {
    prisma.supplement.create.mockResolvedValue({ id: 's1', userId: 'u1', name: 'Vitamin D', scheduledTime: '09:00' });
    const result = await service.createSupplement('u1', { name: 'Vitamin D' });
    expect(result.userId).toBe('u1');
    expect(prisma.supplement.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'u1', scheduledTime: '09:00' }) }));
  });

  it('rejects invalid schedule times', async () => {
    await expect(service.createSupplement('u1', { name: 'Magnesium', scheduledTime: '9am' })).rejects.toThrow('HH:MM');
  });

  it('enforces ownership', async () => {
    prisma.supplement.findFirst.mockResolvedValue(null);
    await expect(service.takeToday('u1', 'foreign', '2026-08-12')).rejects.toThrow('Supplement not found');
    await expect(service.deleteSupplement('u1', 'foreign')).rejects.toThrow('Supplement not found');
  });

  it('logs a daily dose idempotently', async () => {
    prisma.supplement.findFirst.mockResolvedValue({ id: 's1', userId: 'u1', active: true });
    prisma.supplementLog.upsert.mockResolvedValue({ id: 'l1' });
    const result = await service.takeToday('u1', 's1', '2026-08-12');
    expect(result.taken).toBe(true);
    expect(prisma.supplementLog.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { supplementId_dateKey: { supplementId: 's1', dateKey: '2026-08-12' } } }));
  });

  it('returns today completion status', async () => {
    prisma.supplement.findMany.mockResolvedValue([
      { id: 's1', logs: [{ dateKey: '2026-08-12' }] },
      { id: 's2', logs: [] },
    ]);
    const result = await service.getTodayStatus('u1', '2026-08-12');
    expect(result.total).toBe(2);
    expect(result.taken).toBe(1);
    expect(result.completionPercent).toBe(50);
  });
});
