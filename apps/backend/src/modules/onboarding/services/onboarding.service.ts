import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { CompleteOnboardingDto } from '../dto/complete-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string) {
    let onboarding = await this.prisma.userOnboarding.findUnique({ where: { userId } });
    if (!onboarding) onboarding = await this.prisma.userOnboarding.create({ data: { userId } });
    return onboarding;
  }

  async complete(userId: string, dto: CompleteOnboardingDto) {
    return this.prisma.$transaction(async (tx) => {
      const onboarding = await tx.userOnboarding.upsert({
        where: { userId },
        create: { userId, completed: true, completedAt: new Date(), currentStep: dto.currentStep ?? 'completed' },
        update: { completed: true, completedAt: new Date(), currentStep: dto.currentStep ?? 'completed' },
      });

      const fullName = dto.fullName?.trim();
      if (fullName) {
        const [firstName, ...lastParts] = fullName.split(/\s+/);
        await tx.user.update({ where: { id: userId }, data: { firstName, lastName: lastParts.join(' ') || null } });
      }

      if (dto.gender !== undefined || dto.birthDate !== undefined || dto.heightCm !== undefined || dto.weightKg !== undefined || dto.goal !== undefined) {
        const existing = await tx.userProfile.findUnique({ where: { userId } });
        await tx.userProfile.upsert({
          where: { userId },
          create: {
            userId,
            gender: dto.gender ?? null,
            birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
            heightCm: dto.heightCm ?? null,
            weightKg: dto.weightKg ?? null,
            primaryGoal: dto.goal ?? null,
          },
          update: {
            gender: dto.gender ?? existing?.gender,
            birthDate: dto.birthDate ? new Date(dto.birthDate) : existing?.birthDate,
            heightCm: dto.heightCm ?? existing?.heightCm,
            weightKg: dto.weightKg ?? existing?.weightKg,
            primaryGoal: dto.goal ?? existing?.primaryGoal,
          },
        });
      }

      if (dto.gender !== undefined || dto.heightCm !== undefined || dto.weightKg !== undefined || dto.fitnessLevel !== undefined) {
        const existing = await tx.healthProfile.findUnique({ where: { userId } });
        const activityLevel = dto.fitnessLevel
          ? ({ beginner: 'beginner', foundation: 'light', intermediate: 'moderate', advanced: 'high' } as const)[dto.fitnessLevel]
          : existing?.activityLevel;
        await tx.healthProfile.upsert({
          where: { userId },
          create: { userId, gender: dto.gender ?? null, heightCm: dto.heightCm ?? null, weightKg: dto.weightKg ?? null, activityLevel: activityLevel ?? null },
          update: { gender: dto.gender ?? existing?.gender, heightCm: dto.heightCm ?? existing?.heightCm, weightKg: dto.weightKg ?? existing?.weightKg, activityLevel },
        });
      }

      if (dto.goal !== undefined || dto.diet !== undefined) {
        const existing = await tx.nutritionProfile.findUnique({ where: { userId } });
        await tx.nutritionProfile.upsert({
          where: { userId },
          create: { userId, dietType: dto.diet ?? null },
          update: { dietType: dto.diet ?? existing?.dietType },
        });
      }

      return onboarding;
    });
  }
}
