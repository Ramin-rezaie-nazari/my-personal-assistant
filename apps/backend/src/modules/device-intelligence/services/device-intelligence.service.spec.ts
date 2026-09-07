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

  it('exposes the complete normalized metric contract', async () => {
    const service = new DeviceIntelligenceService();
    const result = await service.getHealthData();

    expect(result.dataContract.normalizedMetrics).toEqual([
      'steps',
      'active_energy_burned',
      'basal_energy_burned',
      'distance',
      'heart_rate',
      'sleep',
      'workout',
      'body_weight',
      'body_fat',
      'blood_pressure',
      'blood_glucose',
      'oxygen_saturation',
    ]);
  });

  it('explains why native access is unavailable instead of silently degrading', async () => {
    const service = new DeviceIntelligenceService();
    const result = await service.getHealthData();

    expect(result.notes).toEqual(
      expect.arrayContaining([
        'Native HealthKit / Health Connect bridges are not configured in this build.',
        'No synthetic health values are returned while the provider layer is unavailable.',
      ]),
    );
  });
});
