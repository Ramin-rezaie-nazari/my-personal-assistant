import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type OnboardingCompletion = {
  currentStep?: string;
  fullName?: string;
  gender?: string;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  primaryGoal?: string;
  fitnessLevel?: string;
  dietType?: string;
  workoutPlace?: string;
  rhythm?: string;
  detectedCountry?: string;
  equipment?: string;
  sessionMinutes?: number;
  trainingDaysPerWeek?: number;
};

const ONBOARDING_FACTS = [
  'fitness_level',
  'workout_place',
  'rhythm',
  'detected_country',
  'equipment',
  'session_minutes',
  'training_days_per_week',
] as const;

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
      if (data.fullName?.trim()) {
        const parts = data.fullName.trim().split(/\s+/);
        const firstName = parts.shift() || null;
        const lastName = parts.length ? parts.join(' ') : null;
        await tx.user.update({ where: { id: userId }, data: { firstName, lastName } });
      }

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

      await tx.nutritionProfile.upsert({
        where: { userId },
        create: { userId, dietType: data.dietType },
        update: { dietType: data.dietType },
      });

      const factValues: Record<string, string | undefined> = {
        fitness_level: data.fitnessLevel,
        workout_place: data.workoutPlace,
        rhythm: data.rhythm,
        detected_country: data.detectedCountry,
        equipment: data.equipment,
        session_minutes: data.sessionMinutes === undefined ? undefined : String(data.sessionMinutes),
        training_days_per_week: data.trainingDaysPerWeek === undefined ? undefined : String(data.trainingDaysPerWeek),
      };
      for (const key of ONBOARDING_FACTS) {
        const value = factValues[key];
        if (value === undefined) continue;
        await tx.userFact.deleteMany({ where: { userId, category: 'onboarding', key } });
        await tx.userFact.create({
          data: { userId, category: 'onboarding', key, value, confidence: 1, importance: 2, source: 'onboarding' },
        });
      }

      await tx.userPreference.upsert({
        where: { userId },
        create: { userId, onboardingCompleted: true },
        update: { onboardingCompleted: true },
      });

      const onboarding = await tx.userOnboarding.upsert({
        where: { userId },
        create: { userId, completed: true, completedAt: new Date(), currentStep: data.currentStep ?? 'completed' },
        update: { completed: true, completedAt: new Date(), currentStep: data.currentStep ?? 'completed' },
      });

      return { ...onboarding, preferencesUpdated: true };
    });
  }
}
