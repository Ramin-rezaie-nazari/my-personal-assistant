import { CalisthenicsLibraryService } from '../../calisthenics/services/calisthenics-library.service';
import { GymLibraryService } from '../../gym/services/gym-library.service';
import { YogaLibraryService } from '../../yoga/services/yoga-library.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { FitnessCatalogService } from './fitness-catalog.service';

describe('FitnessCatalogService', () => {
  const prisma = {
    $queryRaw: jest.fn().mockRejectedValue(new Error('persistent fitness catalog unavailable')),
    $executeRaw: jest.fn(),
  } as unknown as PrismaService;
  const service = new FitnessCatalogService(
    prisma,
    new GymLibraryService(),
    new CalisthenicsLibraryService(),
    new YogaLibraryService(),
  );

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('exposes exactly ten progression levels and never leaks harder items into a lower level', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } }),
    );

    const result = await service.list({ discipline: 'yoga', level: 3, page: 1, pageSize: 50 });
    expect(result.tenLevelScale).toHaveLength(10);
    expect(result.tenLevelScale.map((entry) => entry.level)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(result.items.every((item) => item.difficultyLevel <= 3)).toBe(true);
  });

  it('paginates deterministically and marks the four-image standard explicitly', async () => {
    const payload = [{
      id: 'bench-press',
      name: 'Bench Press',
      level: 'intermediate',
      equipment: 'barbell',
      primaryMuscles: ['chest'],
      secondaryMuscles: ['triceps'],
      instructions: ['Set your shoulder blades and press with control.'],
      category: 'strength',
      images: ['Bench_Press/0.jpg', 'Bench_Press/1.jpg'],
    }];
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } }),
    );

    const result = await service.list({ discipline: 'gym', level: 10, page: 1, pageSize: 1 });
    const exercise = result.items.find((item) => item.id === 'public-bench-press');
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(1);
    expect(exercise?.mediaActual).toBe(2);
    expect(exercise?.mediaRequired).toBe(4);
    expect(exercise?.mediaComplete).toBe(false);
    expect(exercise?.media[0].webpUrl).toContain('output=webp');
  });
});
