import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      gender?: string;
      birthDate?: string;
      heightCm?: number;
      weightKg?: number;
      primaryGoal?: string;
    },
  ) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      },
      update: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      },
    });
  }
}
