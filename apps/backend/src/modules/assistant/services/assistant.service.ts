import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class AssistantService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    let profile = await this.prisma.assistantProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.assistantProfile.create({
        data: {
          userId,
        },
      });
    }

    return profile;
  }

  async updateProfile(
    userId: string,
    data: {
      healthGoal?: string;
      fitnessGoal?: string;
      nutritionGoal?: string;
      smokingHabit?: string;
      waterGoalMl?: number;
      sleepGoalHours?: number;
      exerciseGoal?: string;
    },
  ) {
    return this.prisma.assistantProfile.upsert({
      where: {
        userId,
      },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }
}
