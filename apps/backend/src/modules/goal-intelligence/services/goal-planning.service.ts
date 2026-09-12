import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class GoalPlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async createGoalPlan(userId: string, goalId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; title: string; progressPercent: number; targetDate: Date | null }>>`
      SELECT "id","title","progressPercent","targetDate"
      FROM "Goal"
      WHERE "id"=${goalId} AND "userId"=${userId}
      LIMIT 1
    `;
    const goal = rows[0];
    if (!goal) return null;
    const remaining = Math.max(0, 100 - Number(goal.progressPercent));
    const days = goal.targetDate ? Math.max(1, Math.ceil((goal.targetDate.getTime() - Date.now()) / 86400000)) : null;
    return {
      goalId: goal.id,
      title: goal.title,
      targetDate: goal.targetDate,
      remainingPercent: remaining,
      dailyProgressTarget: days ? Number((remaining / days).toFixed(2)) : null,
      urgency: days === null ? 'open' : days <= 3 ? 'urgent' : days <= 14 ? 'soon' : 'normal',
    };
  }
}
