import { FitnessProgramService } from './fitness-program.service';

describe('FitnessProgramService', () => {
  const makeService = () => {
    const prisma = {
      $queryRaw: jest.fn(),
      fitnessPlanAssignment: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    } as any;
    return { prisma, service: new FitnessProgramService(prisma) };
  };

  it('lists only published programs with stable paging metadata', async () => {
    const { prisma, service } = makeService();
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: 'program-1', name: 'Strength', sessionCount: 24 }])
      .mockResolvedValueOnce([{ count: 1n }]);

    const result = await service.list({ discipline: 'gym', limit: 10, offset: 0 });

    expect(result).toEqual({
      items: [{ id: 'program-1', name: 'Strength', sessionCount: 24 }],
      total: 1,
      limit: 10,
      offset: 0,
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('starts an available program for the authenticated user', async () => {
    const { prisma, service } = makeService();
    prisma.$queryRaw.mockResolvedValueOnce([{
      id: 'program-1',
      versionId: 'version-1',
      durationWeeks: 4,
      sessionsPerWeek: 3,
      sessionDurationMin: 30,
    }]);
    prisma.$queryRaw.mockResolvedValueOnce([]);
    prisma.fitnessPlanAssignment.findUnique.mockResolvedValue(null);
    prisma.fitnessPlanAssignment.upsert.mockResolvedValue({ id: 'assignment-1' });

    prisma.$queryRaw
      .mockResolvedValueOnce([{
        id: 'program-1',
        versionId: 'version-1',
        durationWeeks: 4,
        sessionsPerWeek: 3,
        sessionDurationMin: 30,
      }])
      .mockResolvedValueOnce([]);

    const result = await service.start('user-1', { programId: 'program-1' });

    expect(prisma.fitnessPlanAssignment.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_programVersionId: { userId: 'user-1', programVersionId: 'version-1' } },
      create: expect.objectContaining({ userId: 'user-1', programVersionId: 'version-1', status: 'active' }),
    }));
    expect(result.id).toBe('program-1');
  });
});
