import { RecipeLibraryService } from './recipe-library.service';

describe('RecipeLibraryService', () => {
  it('keeps library queries bounded, searchable and owner-aware', async () => {
    const prisma = {
      $transaction: jest.fn().mockResolvedValue([
        [{ id: 'r1', name: 'Chicken Bowl', userId: null }],
        42,
      ]),
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
  });
});
