import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class DailyService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyLog(userId: string, dateKey?: string) {
    const key = this.normalizeDateKey(dateKey);

    return this.prisma.dailyLog.findUnique({
      where: { userId_dateKey: { userId, dateKey: key } },
    });
  }

  async getDailyLogs(userId: string, startDateKey: string, endDateKey: string) {
    const start = this.normalizeDateKey(startDateKey);
    const end = this.normalizeDateKey(endDateKey);

    if (start > end) {
      throw new BadRequestException('startDateKey must be before endDateKey');
    }

    return this.prisma.dailyLog.findMany({
      where: {
        userId,
        dateKey: { gte: start, lte: end },
      },
      orderBy: { dateKey: 'asc' },
    });
  }

  async updateDailyLog(
    userId: string,
    data: {
      dateKey?: string;
      waterMl?: number;
      calories?: number;
      protein?: number;
    },
  ) {
    const dateKey = this.normalizeDateKey(data.dateKey);
    const { dateKey: _dateKey, ...values } = data;

    return this.prisma.dailyLog.upsert({
      where: { userId_dateKey: { userId, dateKey } },
      update: values,
      create: { userId, dateKey, ...values },
    });
  }

  async addWater(userId: string, amountMl: number, dateKey?: string) {
    if (!Number.isFinite(amountMl) || amountMl <= 0 || amountMl > 5000) {
      throw new BadRequestException('amountMl must be between 1 and 5000');
    }

    const key = this.normalizeDateKey(dateKey);

    return this.prisma.dailyLog.upsert({
      where: { userId_dateKey: { userId, dateKey: key } },
      update: { waterMl: { increment: Math.round(amountMl) } },
      create: { userId, dateKey: key, waterMl: Math.round(amountMl) },
    });
  }

  private normalizeDateKey(dateKey?: string): string {
    const value = dateKey ?? new Date().toISOString().slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('dateKey must use YYYY-MM-DD format');
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('dateKey must be a valid calendar date');
    }

    return value;
  }
}
