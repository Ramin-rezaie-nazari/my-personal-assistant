import { Injectable } from '@nestjs/common';

import { DailyService } from '../../daily/services/daily.service';
import { BrainWeeklyStatus } from '../types/brain-weekly-status.types';

@Injectable()
export class BrainWeeklyStatusService {
  constructor(private readonly dailyService: DailyService) {}

  async getThisWeek(userId: string): Promise<BrainWeeklyStatus> {
    const end = this.utcDateKey(new Date());
    const startDate = this.addDays(new Date(`${end}T00:00:00.000Z`), -6);
    const start = this.utcDateKey(startDate);

    const logs = await this.dailyService.getDailyLogs(userId, start, end);
    const byDate = new Map(logs.map((log) => [log.dateKey, log]));
    const days = Array.from({ length: 7 }, (_, index) => {
      const dateKey = this.utcDateKey(this.addDays(startDate, index));
      const log = byDate.get(dateKey);

      return {
        dateKey,
        hasLog: Boolean(log),
        waterMl: log?.waterMl ?? 0,
        calories: log?.calories ?? 0,
        protein: log?.protein ?? 0,
      };
    });

    const loggedDays = days.filter((day) => day.hasLog).length;
    const totalCalories = days.reduce((sum, day) => sum + day.calories, 0);
    const totalProtein = days.reduce((sum, day) => sum + day.protein, 0);
    const totalWaterMl = days.reduce((sum, day) => sum + day.waterMl, 0);

    let currentStreak = 0;
    for (let index = days.length - 1; index >= 0; index -= 1) {
      if (!days[index].hasLog) break;
      currentStreak += 1;
    }

    return {
      startDateKey: start,
      endDateKey: end,
      days,
      loggedDays,
      consistencyPercent: Math.round((loggedDays / 7) * 100),
      totalCalories,
      totalProtein,
      totalWaterMl,
      averageCalories: Math.round(totalCalories / 7),
      averageProtein: Math.round((totalProtein / 7) * 10) / 10,
      averageWaterMl: Math.round(totalWaterMl / 7),
      currentStreak,
    };
  }

  private addDays(date: Date, amount: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + amount);
    return result;
  }

  private utcDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
