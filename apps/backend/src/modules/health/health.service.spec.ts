import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports ok when the database probe succeeds', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const service = new HealthService(prisma as any);

    await expect(service.check()).resolves.toMatchObject({
      status: 'ok',
      service: 'My Personal Assistant API',
      database: 'ok',
      timestamp: expect.any(String),
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('reports degraded when the database probe fails without exposing the database error', async () => {
    const prismaError = new Error('secret database connection details');
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(prismaError),
    };
    const service = new HealthService(prisma as any);

    const result = await service.check();

    expect(result).toMatchObject({
      status: 'degraded',
      database: 'unavailable',
      timestamp: expect.any(String),
    });
    expect(JSON.stringify(result)).not.toContain(prismaError.message);
  });
});
