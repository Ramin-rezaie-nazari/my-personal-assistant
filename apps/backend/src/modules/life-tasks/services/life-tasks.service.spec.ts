import { BadRequestException } from '@nestjs/common';
import { LifeTasksService } from './life-tasks.service';

describe('LifeTasksService', () => {
  const prisma = {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  } as any;
  const service = new LifeTasksService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('rejects invalid priority before touching the database', async () => {
    await expect(service.create('user-1', { title: 'Task', priority: 4 } as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('preserves completedAt on metadata-only updates', async () => {
    const completedAt = new Date('2026-09-01T10:00:00Z');
    prisma.$queryRaw.mockResolvedValueOnce([{ id: 'task-1', status: 'completed', completedAt, title: 'Done', description: null, priority: 2, estimatedMinutes: 10, energyLevel: 'medium', dueAt: null, scheduledAt: null }]);
    prisma.$executeRaw.mockResolvedValueOnce(1);
    prisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await service.update('user-1', 'task-1', { priority: 2 } as any);
    const sql = prisma.$executeRaw.mock.calls[0][0].join('');
    expect(sql).toContain('"completedAt"');
  });
});
