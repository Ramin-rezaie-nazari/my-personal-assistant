import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { getDateKeyInTimezone } from '../../../common/utils/user-time';
import { DailyService } from '../../daily/services/daily.service';
import { BrainDailyStatus } from '../types/brain-daily-status.types';

@Injectable()
export class BrainDailyStatusService {
  constructor(
    private readonly dailyService: DailyService,
    private readonly prisma: PrismaService,
  ) {}

  async getToday(userId: string): Promise<BrainDailyStatus> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    const dateKey = getDateKeyInTimezone(new Date(), settings?.timezone || 'UTC');
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
