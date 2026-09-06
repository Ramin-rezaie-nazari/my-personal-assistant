import { createHash } from 'node:crypto';
import { SessionService } from './session.service';

function fingerprint(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

describe('SessionService refresh-token storage', () => {
  function createService() {
    const prisma = {
      session: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    return { service: new SessionService(prisma as any), prisma };
  }

  it('stores a one-way fingerprint instead of the raw refresh token', async () => {
    const { service, prisma } = createService();
    const token = 'refresh-token-123';

    await service.create({
      userId: 'user-1',
      refreshToken: token,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    });

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        refreshToken: fingerprint(token),
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      },
    });
    expect(prisma.session.create.mock.calls[0][0].data.refreshToken).not.toBe(token);
  });

  it('looks up both hardened fingerprints and legacy raw sessions during migration', async () => {
    const { service, prisma } = createService();
    const token = 'legacy-or-new-token';

    await service.findByRefreshToken(token);

    expect(prisma.session.findMany).toHaveBeenCalledWith({
      where: {
        expiresAt: { gt: expect.any(Date) },
        OR: [{ refreshToken: fingerprint(token) }, { refreshToken: token }],
      },
      take: 2,
    });
  });

  it('consumes hardened or legacy sessions through the same compatibility path', async () => {
    const { service, prisma } = createService();
    const token = 'refresh-token-to-consume';

    await service.consumeRefreshToken(token);

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: { gt: expect.any(Date) },
        OR: [{ refreshToken: fingerprint(token) }, { refreshToken: token }],
      },
    });
  });
});
