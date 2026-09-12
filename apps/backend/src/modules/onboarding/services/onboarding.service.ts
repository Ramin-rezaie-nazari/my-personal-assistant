import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type OnboardingCompletion = {
  currentStep?: string;
  gender?: string;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  primaryGoal?: string;
  dietType?: string;
  workoutPlace?: string;
  rhythm?: string;
};

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string) {
    let onboarding = await this.prisma.userOnboarding.findUnique({ where: { userId } });
    if (!onboarding) onboarding = await this.prisma.userOnboarding.create({ data: { userId } });
    return onboarding;
  }

  async complete(userId: string, data: OnboardingCompletion) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          gender: data.gender,
          birthDate: data.birthDate ? new Date(`${data.birthDate}T00:00:00.000Z`) : undefined,
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          primaryGoal: data.primaryGoal,
        },
        update: {
          gender: data.gender,
          birthDate: data.birthDate ? new Date(`${data.birthDate}T00:00:00.000Z`) : undefined,
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          primaryGoal: data.primaryGoal,
        },
      });

      const preferences = await tx.userPreference.upsert({
        where: { userId },
        create: { userId, onboardingCompleted: true },
        update: { onboardingCompleted: true },
      });

      const onboarding = await tx.userOnboarding.upsert({
        where: { userId },
        create: { userId, completed: true, completedAt: new Date(), currentStep: data.currentStep ?? 'completed' },
        update: { completed: true, completedAt: new Date(), currentStep: data.currentStep ?? 'completed' },
      });

      return { ...onboarding, preferencesUpdated: Boolean(preferences) };
    });
  }
}
