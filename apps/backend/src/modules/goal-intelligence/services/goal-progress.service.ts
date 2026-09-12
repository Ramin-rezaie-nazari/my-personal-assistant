import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

type GoalProgressRow = {
  id: string;
  title: string;
  status: string;
  progressPercent: number;
  targetDate: Date | null;
  updatedAt: Date;
  priority: number;
};

@Injectable()
export class GoalProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async trackProgress(userId: string, goalId?: string) {
    const rows = goalId
      ? await this.prisma.$queryRaw<GoalProgressRow[]>`
          SELECT "id", "title", "status", "progressPercent", "targetDate", "updatedAt", "priority"
          FROM "Goal"
          WHERE "id" = ${goalId} AND "userId" = ${userId}
          LIMIT 1
        `
      : await this.prisma.$queryRaw<GoalProgressRow[]>`
          SELECT "id", "title", "status", "progressPercent", "targetDate", "updatedAt", "priority"
          FROM "Goal"
          WHERE "userId" = ${userId} AND "status" = 'active'
          ORDER BY "priority" ASC, "targetDate" ASC NULLS LAST, "updatedAt" DESC
          LIMIT 50
        `;

    const now = Date.now();
    return rows.map((goal) => ({
      goalId: goal.id,
      title: goal.title,
      status: goal.status,
      progressPercent: Number(goal.progressPercent),
      remainingPercent: Math.max(0, 100 - Number(goal.progressPercent)),
      targetDate: goal.targetDate,
      overdue: Boolean(
        goal.targetDate &&
          goal.targetDate.getTime() < now &&
          Number(goal.progressPercent) < 100,
      ),
      updatedAt: goal.updatedAt,
    }));
  }
}
