import { UsersService } from './users.service';

describe('UsersService', () => {
  it('revokes sessions and deletes the authenticated user atomically', async () => {
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'u1' }),
        delete: jest.fn().mockResolvedValue({ id: 'u1' }),
      },
      session: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
      user: { findUnique: jest.fn() },
    } as any;
    const service = new UsersService(prisma);
    await expect(service.deleteAccount('u1')).resolves.toEqual({ deleted: true });
    expect(tx.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });
});
