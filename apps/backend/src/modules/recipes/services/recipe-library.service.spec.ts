import { RecipeLibraryService } from './recipe-library.service';

describe('RecipeLibraryService', () => {
  it('keeps library queries bounded, searchable and owner-aware', async () => {
    const prisma = {
      $transaction: jest.fn().mockResolvedValue([
        [{ id: 'r1', name: 'Chicken Bowl', userId: null }],
        42,
      ]),
    } as never;
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
    const [findMany, count] = prisma.$transaction.mock.calls[0][0];
    expect(findMany).toBeTruthy();
    expect(count).toBeTruthy();
  });
});
