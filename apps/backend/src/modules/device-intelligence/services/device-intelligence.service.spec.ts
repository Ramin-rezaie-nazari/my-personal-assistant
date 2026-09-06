import { DeviceIntelligenceService } from './device-intelligence.service';

describe('DeviceIntelligenceService', () => {
  it('returns explicit unavailable integration status without fake health values', async () => {
    const service = new DeviceIntelligenceService();

    await expect(service.getHealthData()).resolves.toMatchObject({
      integration: 'device_health',
      status: 'not_configured',
      providers: {
        iosHealthKit: 'not_configured',
        androidHealthConnect: 'not_configured',
      },
      dataContract: {
        incrementalSync: true,
        dedupeRequired: true,
      },
    });

    const result = await service.getHealthData();
    expect(result).not.toHaveProperty('steps');
    expect(result).not.toHaveProperty('caloriesBurned');
    expect(result).not.toHaveProperty('sleepHours');
  });
});
