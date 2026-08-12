import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { LearningService } from './learning.service';

@Injectable()
export class UserIntelligenceService {
  constructor(private readonly prisma: PrismaService, private readonly learning: LearningService) {}

  async getProfile(userId: string) {
    const [facts, insights, behavior] = await Promise.all([
      this.prisma.userFact.findMany({ where: { userId }, orderBy: [{ importance: 'desc' }, { confidence: 'desc' }] }),
      this.prisma.userInsight.findMany({ where: { userId }, orderBy: [{ importance: 'desc' }, { confidence: 'desc' }], take: 20 }),
      this.learning.buildProfile(userId),
    ]);
    return { userId, facts, insights, behavior };
  }

  async analyzeBehavior(userId: string) {
    const profile = await this.learning.buildProfile(userId);
    if (profile.bestHours.length) {
      const hour = profile.bestHours[0];
      await this.learning.createInsight(userId, 'Best focus window', `The user has the strongest observed completion rate around ${hour}:00.`, profile.patterns[0]?.confidence ?? 0.5, 2);
    }
    if (profile.snoozeRate >= 0.35) {
      await this.learning.createInsight(userId, 'High snooze signal', 'Many actions are being snoozed; future plans should use fewer, better-timed prompts.', Math.min(0.95, profile.snoozeRate), 2);
    }
    if (profile.preferredTaskMinutes) {
      await this.learning.createInsight(userId, 'Preferred task size', `Observed tasks average about ${profile.preferredTaskMinutes} minutes.`, 0.6, 1);
    }
    return this.getProfile(userId);
  }
}
