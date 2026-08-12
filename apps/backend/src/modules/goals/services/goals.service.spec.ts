import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GoalsService } from './goals.service';

describe('GoalsService', () => {
  const prisma = {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  } as any;
  let service: GoalsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GoalsService(prisma);
  });

  it('rejects an empty goal title', async () => {
    await expect(service.create('u1', { title: '   ' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid priorities', async () => {
    await expect(service.create('u1', { title: 'Exercise', priority: 5 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a goal and returns its hydrated representation', async () => {
    const row = { id: 'g1', userId: 'u1', title: 'Exercise', description: null, category: 'fitness', status: 'active', priority: 1, targetDate: null, progressPercent: 0, targetValue: null, currentValue: null, unit: null, createdAt: new Date(), updatedAt: new Date() };
    prisma.$executeRaw.mockResolvedValue(1);
    prisma.$queryRaw.mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
    const result = await service.create('u1', { title: 'Exercise', category: 'fitness', priority: 1 });
    expect(result.id).toBe('g1');
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('does not expose another user goal', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    await expect(service.findOne('u1', 'g1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('validates progress check-ins', async () => {
    await expect(service.checkin('u1', 'g1', { progressPercent: 101 })).rejects.toBeInstanceOf(NotFoundException);
    prisma.$queryRaw.mockResolvedValueOnce([{ id: 'g1', userId: 'u1', title: 'Goal', description: null, category: 'general', status: 'active', priority: 2, targetDate: null, progressPercent: 0, targetValue: null, currentValue: null, unit: null, createdAt: new Date(), updatedAt: new Date() }]);
    await expect(service.checkin('u1', 'g1', { progressPercent: 101 })).rejects.toBeInstanceOf(BadRequestException);
  });
});
