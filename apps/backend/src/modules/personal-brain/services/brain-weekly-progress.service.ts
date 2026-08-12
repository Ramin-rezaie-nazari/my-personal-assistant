import { Injectable } from '@nestjs/common';
import { DailyService } from '../../daily/services/daily.service';
import { BrainWeeklyProgress } from '../types';

@Injectable()
export class BrainWeeklyProgressService {
  constructor(private readonly dailyService: DailyService) {}

  async getProgress(userId: string): Promise<BrainWeeklyProgress> {
    const logs = await this.dailyService.getRecentDailyLogs(userId, 7);
    const totals = logs.reduce(
      (acc, log) => ({
        waterMl: acc.waterMl + log.waterMl,
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
      }),
      { waterMl: 0, calories: 0, protein: 0 },
    );

    const daysWithLogs = logs.length;

    return {
      days: 7,
      daysWithLogs,
      totalWaterMl: totals.waterMl,
      averageWaterMl: daysWithLogs ? totals.waterMl / daysWithLogs : 0,
      totalCalories: totals.calories,
      averageCalories: daysWithLogs ? totals.calories / daysWithLogs : 0,
      totalProtein: totals.protein,
      averageProtein: daysWithLogs ? totals.protein / daysWithLogs : 0,
    };
  }
}
