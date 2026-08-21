import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class DeviceIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealthData(userId: string, dateKey?: string) {
    if (!userId) throw new BadRequestException('userId is required');
    const key = dateKey ?? new Date().toISOString().slice(0, 10);
    const start = new Date(`${key}T00:00:00.000Z`);
    const end = new Date(`${key}T23:59:59.999Z`);
    const points = await this.prisma.healthDataPoint.findMany({ where: { userId, startAt: { gte: start, lte: end } }, orderBy: { startAt: 'asc' } });
    const sum = (type: string) => points.filter(p => p.dataType === type).reduce((n, p) => n + Number(p.value), 0);
    const latest = (type: string) => { const rows = points.filter(p => p.dataType === type); return rows.length ? Number(rows[rows.length - 1].value) : null; };
    const activeCalories = sum('active_calories');
    const totalCalories = sum('total_calories');
    const steps = sum('steps');
    const distance = sum('distance_walking_running');
    const sleepMinutes = sum('sleep_duration');
    const workoutMinutes = sum('workout_duration');
    const workoutCalories = sum('workout_calories');
    const heartRates = points.filter(p => p.dataType === 'heart_rate').map(p => Number(p.value));
    const avgHeartRate = heartRates.length ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : null;
    const restingHeartRate = latest('resting_heart_rate');
    const weightKg = latest('weight');
    const dailyLog = await this.prisma.dailyLog.findUnique({ where: { userId_dateKey: { userId, dateKey: key } }, select: { calories: true, protein: true } });
    return {
      dateKey: key,
      activity: { steps: Math.round(steps), distanceWalkingRunningMeters: distance, activeCaloriesBurned: activeCalories, totalCaloriesBurned: totalCalories || null, workoutCaloriesBurned: workoutCalories, workoutMinutes, sleepMinutes },
      vitals: { averageHeartRateBpm: avgHeartRate ? Number(avgHeartRate.toFixed(1)) : null, restingHeartRateBpm: restingHeartRate, weightKg },
      nutrition: { caloriesConsumed: dailyLog?.calories ?? 0, proteinConsumedGrams: dailyLog?.protein ?? 0 },
      brainContext: { activityCaloriesAvailable: activeCalories > 0, totalCaloriesAvailable: totalCalories > 0, stepsAvailable: steps > 0, sleepAvailable: sleepMinutes > 0, workoutAvailable: workoutMinutes > 0, sourcePointCount: points.length },
    };
  }
}
