import { RecipeLibraryService } from './recipe-library.service';

describe('RecipeLibraryService', () => {
  it('keeps library queries bounded, searchable and owner-aware', async () => {
    const prisma = {
      recipe: {
        findMany: jest.fn().mockResolvedValue([{ id: 'r1', name: 'Chicken Bowl', userId: null }]),
        count: jest.fn().mockResolvedValue(42),
      },
      $transaction: jest.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    } as any;
    const service = new RecipeLibraryService(prisma);

    const result = await service.list('user-1', { page: 2, pageSize: 24, q: 'chicken', verified: true });

    expect(result).toEqual({
      items: [{ id: 'r1', name: 'Chicken Bowl', userId: null }],
      total: 42,
      page: 2,
      pageSize: 24,
      hasNextPage: true,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 24, take: 24 }));
    expect(prisma.recipe.count).toHaveBeenCalledTimes(1);
  });
});
