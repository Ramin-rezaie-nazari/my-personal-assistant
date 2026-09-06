import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { SaveOnboardingDto } from './dto/save-onboarding.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateProfile(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
    },
  ) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    };
  }

  async saveOnboarding(id: string, data: SaveOnboardingDto) {
    const nameParts = (data.fullName ?? '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || undefined;
    const lastName = nameParts.slice(1).join(' ') || undefined;
    const completedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          ...(firstName !== undefined ? { firstName } : {}),
          ...(lastName !== undefined ? { lastName } : {}),
        },
      });

      await tx.userProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          gender: data.gender,
          birthDate: new Date(data.birthDate),
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          primaryGoal: data.goal,
        },
        update: {
          gender: data.gender,
          birthDate: new Date(data.birthDate),
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          primaryGoal: data.goal,
        },
      });

      await tx.userPreference.upsert({
        where: { userId: id },
        create: {
          userId: id,
          onboardingCompleted: true,
          notificationsEnabled: data.notificationsEnabled,
          theme: data.gender === 'female' ? 'feminine' : 'default',
        },
        update: {
          onboardingCompleted: true,
          notificationsEnabled: data.notificationsEnabled,
          theme: data.gender === 'female' ? 'feminine' : 'default',
        },
      });

      await tx.userOnboarding.upsert({
        where: { userId: id },
        create: {
          userId: id,
          completed: true,
          currentStep: 'complete',
          completedAt,
        },
        update: {
          completed: true,
          currentStep: 'complete',
          completedAt,
        },
      });

      const facts = [
        ['onboarding.fitnessLevel', data.fitnessLevel],
        ['onboarding.diet', data.diet],
        ['onboarding.workoutPlace', data.workoutPlace],
        ['onboarding.trainingDaysPerWeek', String(data.trainingDaysPerWeek)],
        ['onboarding.equipment', data.equipment],
        ['onboarding.sessionMinutes', String(data.sessionMinutes)],
        ['onboarding.detectedCountry', data.detectedCountry?.trim() || ''],
        ['onboarding.locationPermissionGranted', String(Boolean(data.locationPermissionGranted))],
        ['onboarding.cameraPermissionGranted', String(Boolean(data.cameraPermissionGranted))],
        ['onboarding.microphonePermissionGranted', String(Boolean(data.microphonePermissionGranted))],
      ];

      for (const [key, value] of facts) {
        await tx.userFact.upsert({
          where: { userId_key: { userId: id, key } },
          create: {
            userId: id,
            key,
            value,
            source: 'onboarding',
            confidence: 1,
          },
          update: {
            value,
            source: 'onboarding',
            confidence: 1,
          },
        });
      }
    });

    return {
      completed: true,
      profile: {
        gender: data.gender,
        birthDate: data.birthDate,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        primaryGoal: data.goal,
      },
      preferences: {
        theme: data.gender === 'female' ? 'feminine' : 'default',
        notificationsEnabled: data.notificationsEnabled,
      },
      onboarding: {
        completed: true,
        currentStep: 'complete',
        completedAt: completedAt.toISOString(),
      },
    };
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }
}
