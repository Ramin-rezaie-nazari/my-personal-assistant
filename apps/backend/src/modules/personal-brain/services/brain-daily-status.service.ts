import { Injectable } from '@nestjs/common';

import { DailyService } from '../../daily/services/daily.service';
import { BrainDailyStatus } from '../types/brain-daily-status.types';

@Injectable()
export class BrainDailyStatusService {
  constructor(private readonly dailyService: DailyService) {}

  async getToday(userId: string): Promise<BrainDailyStatus> {
    const dateKey = new Date().toISOString().slice(0, 10);
    const log = await this.dailyService.getDailyLog(userId, dateKey);

    return {
      dateKey,
      hasLog: Boolean(log),
      waterMl: log?.waterMl ?? 0,
      calories: log?.calories ?? 0,
      protein: log?.protein ?? 0,
    };
  }
}
