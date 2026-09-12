import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string) {
    let onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      onboarding = await this.prisma.userOnboarding.create({
        data: {
          userId,
        },
      });
    }

    return onboarding;
  }

  async complete(userId: string, currentStep?: string) {
    return this.prisma.userOnboarding.update({
      where: { userId },
      data: {
        completed: true,
        completedAt: new Date(),
        currentStep: currentStep ?? 'completed',
      },
    });
  }
}
