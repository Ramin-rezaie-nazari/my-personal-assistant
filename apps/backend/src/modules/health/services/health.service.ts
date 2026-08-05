import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.healthProfile.findUnique({
      where: { userId },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      heightCm?: number;
      weightKg?: number;
      age?: number;
      gender?: string;
      activityLevel?: string;
      targetWeightKg?: number;
    },
  ) {
    return this.prisma.healthProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }
}
