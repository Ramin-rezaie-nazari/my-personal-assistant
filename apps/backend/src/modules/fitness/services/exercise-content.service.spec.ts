import { NotFoundException } from '@nestjs/common';
import { ExerciseContentService } from './exercise-content.service';

describe('ExerciseContentService', () => {
  const makeService = () => {
    const prisma = {
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
    } as any;
    return { prisma, service: new ExerciseContentService(prisma) };
  };

  it('does not return an unpublished exercise from the public detail path', async () => {
    const { prisma, service } = makeService();
    prisma.$queryRaw.mockResolvedValueOnce([]);

    await expect(service.get('exercise-draft')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('returns media readiness flags from approved media only', async () => {
    const { prisma, service } = makeService();
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: 'exercise-1', contentStatus: 'published', name: 'Push-up' }])
      .mockResolvedValueOnce([
        { id: 'media-1', kind: 'image', status: 'approved' },
        { id: 'media-2', kind: 'video', status: 'approved' },
      ])
      .mockResolvedValueOnce([{ id: 'rel-1', kind: 'alternative' }]);

    await expect(service.get('exercise-1')).resolves.toMatchObject({
      id: 'exercise-1',
      mediaReady: true,
      videoReady: true,
      media: expect.any(Array),
      relationships: expect.any(Array),
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(3);
  });

  it('persists media provenance fields and review metadata', async () => {
    const { prisma, service } = makeService();
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: 'exercise-1' }])
      .mockResolvedValueOnce([{ id: 'media-1', storageKey: 'fitness/push-up.mp4', rightsBasis: 'owned' }]);
    prisma.$executeRaw.mockResolvedValueOnce(1);

    const reviewedAt = '2026-09-18T12:00:00.000Z';
    await expect(service.addMedia('exercise-1', {
      kind: 'video',
      url: 'https://example.com/push-up.mp4',
      sourceProvider: 'MYPA Curated',
      license: 'MYPA-owned',
      acquisitionMode: 'owned',
      sourceReference: 'internal-catalog/push-up',
      rightsBasis: 'owned',
      creator: 'MYPA',
      storageKey: 'fitness/push-up.mp4',
      transformed: true,
      reviewer: 'catalog-review',
      reviewedAt,
      contentVersion: 'v1',
      status: 'approved',
    })).resolves.toMatchObject({ id: 'media-1' });

    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
