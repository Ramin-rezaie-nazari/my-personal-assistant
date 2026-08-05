import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class DailyService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyLog(userId: string) {
    return this.prisma.dailyLog.findUnique({
      where: { userId },
    });
  }

  async updateDailyLog(
    userId: string,
    data: {
      waterMl?: number;
      calories?: number;
      protein?: number;
    },
  ) {
    return this.prisma.dailyLog.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }
}
