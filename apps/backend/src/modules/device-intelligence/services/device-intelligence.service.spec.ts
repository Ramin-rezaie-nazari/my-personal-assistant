import { DeviceIntelligenceService } from './device-intelligence.service';

describe('DeviceIntelligenceService', () => {
  it('builds a brain-ready daily activity and nutrition summary', async () => {
    const prisma = {
      healthDataPoint: {
        findMany: jest.fn().mockResolvedValue([
          { dataType: 'steps', value: 8200 },
          { dataType: 'distance_walking_running', value: 6400 },
          { dataType: 'active_calories', value: 520 },
          { dataType: 'total_calories', value: 2140 },
          { dataType: 'workout_duration', value: 45 },
          { dataType: 'workout_calories', value: 310 },
          { dataType: 'heart_rate', value: 112 },
          { dataType: 'heart_rate', value: 128 },
          { dataType: 'resting_heart_rate', value: 58 },
          { dataType: 'weight', value: 81.2 },
          { dataType: 'sleep_duration', value: 450 },
        ]),
      },
      dailyLog: {
        findUnique: jest.fn().mockResolvedValue({ calories: 1760, protein: 118 }),
      },
    };

    const service = new DeviceIntelligenceService(prisma as never);
    const result = await service.getHealthData('user-1', '2026-08-21');

    expect(result.activity.steps).toBe(8200);
    expect(result.activity.activeCaloriesBurned).toBe(520);
    expect(result.activity.totalCaloriesBurned).toBe(2140);
    expect(result.nutrition.caloriesConsumed).toBe(1760);
    expect(result.brainContext.activityCaloriesAvailable).toBe(true);
    expect(result.brainContext.stepsAvailable).toBe(true);
    expect(result.vitals.averageHeartRateBpm).toBe(120);
    expect(result.vitals.restingHeartRateBpm).toBe(58);
    expect(result.vitals.weightKg).toBe(81.2);
  });
});
