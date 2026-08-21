import { HealthSyncService } from './health-sync.service';

describe('HealthSyncService', () => {
  it('upserts normalized datapoints idempotently', async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = { healthDataPoint: { upsert } };
    const service = new HealthSyncService(prisma as never);

    const result = await service.syncHealthData('user-1', {
      provider: 'healthkit',
      deviceId: 'watch-1',
      points: [{
        dataType: 'active_calories',
        value: 523,
        unit: 'kcal',
        startAt: '2026-08-21T08:00:00.000Z',
        endAt: '2026-08-21T20:00:00.000Z',
        sourceRecordId: 'sample-1',
      }],
    });

    expect(result.received).toBe(1);
    expect(result.written).toBe(1);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_provider_dataType_sourceRecordId: {
        userId: 'user-1', provider: 'healthkit', dataType: 'active_calories', sourceRecordId: 'sample-1',
      } },
    }));
  });

  it('rejects invalid intervals', async () => {
    const prisma = { healthDataPoint: { upsert: jest.fn() } };
    const service = new HealthSyncService(prisma as never);

    await expect(service.syncHealthData('user-1', {
      provider: 'healthconnect',
      deviceId: 'pixel-watch',
      points: [{ dataType: 'steps', value: 10, unit: 'count', startAt: '2026-08-21T12:00:00Z', endAt: '2026-08-21T11:00:00Z' }],
    })).rejects.toThrow('Invalid health datapoint');
  });
});
