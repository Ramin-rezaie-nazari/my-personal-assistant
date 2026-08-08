import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string) {
    let preferences = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.userPreference.create({
        data: {
          userId,
        },
      });
    }

    return preferences;
  }

  async updatePreferences(
    userId: string,
    data: Prisma.UserPreferenceUpdateInput,
  ) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        onboardingCompleted:
          typeof data.onboardingCompleted === 'boolean'
            ? data.onboardingCompleted
            : undefined,
        notificationsEnabled:
          typeof data.notificationsEnabled === 'boolean'
            ? data.notificationsEnabled
            : undefined,
        reminderEnabled:
          typeof data.reminderEnabled === 'boolean'
            ? data.reminderEnabled
            : undefined,
        theme: typeof data.theme === 'string' ? data.theme : undefined,
      },
    });
  }
}
