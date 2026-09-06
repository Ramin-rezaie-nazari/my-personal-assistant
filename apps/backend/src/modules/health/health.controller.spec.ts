import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns the healthy probe result', async () => {
    const service = {
      check: jest.fn().mockResolvedValue({
        status: 'ok',
        service: 'My Personal Assistant API',
        database: 'ok',
        timestamp: '2030-01-01T00:00:00.000Z',
      }),
    };
    const controller = new HealthController(service as any);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      service: 'My Personal Assistant API',
      database: 'ok',
      timestamp: '2030-01-01T00:00:00.000Z',
    });
  });

  it('throws 503 when the readiness probe is degraded', async () => {
    const service = {
      check: jest.fn().mockResolvedValue({
        status: 'degraded',
        service: 'My Personal Assistant API',
        database: 'unavailable',
        timestamp: '2030-01-01T00:00:00.000Z',
      }),
    };
    const controller = new HealthController(service as any);

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
