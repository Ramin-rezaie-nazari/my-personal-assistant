import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';

import { BrainGoal } from '../types';

@Injectable()
export class BrainGoalService {
  constructor(private readonly prisma: PrismaService) {}

  async getGoals(userId: string): Promise<BrainGoal[]> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { primaryGoal: true },
    });

    if (!profile?.primaryGoal?.trim()) {
      return [];
    }

    return [
      {
        category: 'general',
        title: profile.primaryGoal.trim(),
        priority: 1,
        metadata: {
          source: 'user-profile',
          sourceField: 'primaryGoal',
        },
      },
    ];
  }
}
