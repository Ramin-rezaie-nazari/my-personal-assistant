import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';
import { BrainMemory } from '../types/brain-memory.types';
import { BrainUserContext } from '../types';
import { BrainContext } from '../../brain-integration/types';

@Injectable()
export class UserContextService {
  constructor(private readonly prisma: PrismaService) {}

  async build(input: {
    userId: string;
    context: BrainContext;
    goals: BrainUserContext['goals'];
    memories: BrainMemory[];
  }): Promise<BrainUserContext> {
    const [user, profile, health, nutrition, assistant, settings, preferences] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: input.userId },
          select: { firstName: true, lastName: true },
        }),
        this.prisma.userProfile.findUnique({ where: { userId: input.userId } }),
        this.prisma.healthProfile.findUnique({ where: { userId: input.userId } }),
        this.prisma.nutritionProfile.findUnique({
          where: { userId: input.userId },
        }),
        this.prisma.assistantProfile.findUnique({
          where: { userId: input.userId },
        }),
        this.prisma.userSettings.findUnique({ where: { userId: input.userId } }),
        this.prisma.userPreference.findUnique({
          where: { userId: input.userId },
        }),
      ]);

    const birthDate = profile?.birthDate ?? null;
    const age = birthDate ? this.calculateAge(birthDate) : health?.age ?? undefined;
    const gender = profile?.gender ?? health?.gender ?? undefined;
    const heightCm = profile?.heightCm ?? health?.heightCm ?? undefined;
    const weightKg = profile?.weightKg ?? health?.weightKg ?? undefined;
    const activityLevel = health?.activityLevel ?? undefined;
    const targetWeightKg = health?.targetWeightKg ?? undefined;
    const primaryGoal = profile?.primaryGoal ?? assistant?.healthGoal ?? undefined;

    const preferencesMap: Record<string, unknown> = {
      language: settings?.language,
      timezone: settings?.timezone,
      theme: preferences?.theme,
      notificationsEnabled: preferences?.notificationsEnabled,
      reminderEnabled: preferences?.reminderEnabled,
      onboardingCompleted: preferences?.onboardingCompleted,
      dietType: nutrition?.dietType,
      dailyCaloriesGoal: nutrition?.dailyCaloriesGoal,
      proteinGoalGrams: nutrition?.proteinGoalGrams,
      waterGoalMl: nutrition?.waterGoalMl ?? assistant?.waterGoalMl,
      nutritionGoal: assistant?.nutritionGoal,
      fitnessGoal: assistant?.fitnessGoal,
      exerciseGoal: assistant?.exerciseGoal,
      sleepGoalHours: assistant?.sleepGoalHours,
      primaryGoal,
    };

    const constraints = new Set<string>();
    const dietType = nutrition?.dietType?.trim().toLowerCase();
    if (dietType) constraints.add(`diet:${dietType}`);
    if (assistant?.healthGoal?.trim()) {
      constraints.add(`health-goal:${assistant.healthGoal.trim()}`);
    }
    if (assistant?.exerciseGoal?.trim()) {
      constraints.add(`exercise-goal:${assistant.exerciseGoal.trim()}`);
    }

    const lifeAreas = new Set<string>();
    if (nutrition || assistant?.nutritionGoal || assistant?.healthGoal) {
      lifeAreas.add('nutrition');
      lifeAreas.add('health');
    }
    if (assistant?.fitnessGoal || assistant?.exerciseGoal) lifeAreas.add('fitness');
    if (input.goals.length) lifeAreas.add('goals');
    if (preferences?.reminderEnabled || preferences?.notificationsEnabled) {
      lifeAreas.add('daily-life');
    }

    const knownFacts = input.memories
      .map((memory) => memory.content.trim())
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index)
      .slice(0, 20);

    return {
      userId: input.userId,
      profile: {
        age,
        gender,
        heightCm,
        weightKg,
        activityLevel,
        targetWeightKg,
      },
      lifeAreas: [...lifeAreas],
      preferences: Object.fromEntries(
        Object.entries(preferencesMap).filter(([, value]) => value !== undefined),
      ),
      constraints: [...constraints],
      knownFacts,
      rawContext: {
        context: input.context,
        memories: input.memories,
      },
      goals: input.goals,
    };
  }

  private calculateAge(birthDate: Date, now = new Date()): number {
    let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDelta = now.getUTCMonth() - birthDate.getUTCMonth();
    if (
      monthDelta < 0 ||
      (monthDelta === 0 && now.getUTCDate() < birthDate.getUTCDate())
    ) {
      age -= 1;
    }
    return Math.max(0, age);
  }
}
