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
    const publicCatalog = { list: jest.fn() } as any;
    const service = new RecipeLibraryService(prisma, publicCatalog);

    const result = await service.list('user-1', { page: 2, pageSize: 24, q: 'chicken', verified: true });

    expect(result).toEqual({
      items: [{ id: 'r1', name: 'Chicken Bowl', userId: null }],
      total: 42,
      page: 2,
      pageSize: 24,
      hasNextPage: false,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 24, take: 24 }));
    expect(prisma.recipe.count).toHaveBeenCalledTimes(1);
    expect(publicCatalog.list).not.toHaveBeenCalled();
  });

  it('falls back to the public Wikibooks corpus when no shared recipes exist', async () => {
    const prisma = {
      recipe: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    } as any;
    const publicCatalog = {
      list: jest.fn().mockResolvedValue({
        items: [{ id: 'public-recipe-pasta', name: 'Pasta', userId: null }],
        total: 3895,
        page: 1,
        pageSize: 24,
        hasNextPage: true,
      }),
    } as any;
    const service = new RecipeLibraryService(prisma, publicCatalog);

    await expect(service.list('user-1', { page: 1, pageSize: 24 })).resolves.toMatchObject({
      items: [{ id: 'public-recipe-pasta', name: 'Pasta' }],
      total: 3895,
      hasNextPage: true,
    });
    expect(publicCatalog.list).toHaveBeenCalledWith({ page: 1, pageSize: 24, q: undefined });
  });
});
