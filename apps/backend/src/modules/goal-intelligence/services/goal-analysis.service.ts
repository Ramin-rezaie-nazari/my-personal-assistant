import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

type GoalRow = { id: string; title: string; status: string; priority: number; progressPercent: number; targetDate: Date | null };

@Injectable()
export class GoalAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async analyzeGoal(userId: string, goalId?: string) {
    const rows = goalId
      ? await this.prisma.$queryRaw<GoalRow[]>`SELECT "id","title","status","priority","progressPercent","targetDate" FROM "Goal" WHERE "id"=${goalId} AND "userId"=${userId} LIMIT 1`
      : await this.prisma.$queryRaw<GoalRow[]>`SELECT "id","title","status","priority","progressPercent","targetDate" FROM "Goal" WHERE "userId"=${userId} AND "status"='active' ORDER BY "priority" ASC,"targetDate" ASC NULLS LAST,"createdAt" ASC LIMIT 50`;
    return rows.map((goal) => ({
      ...goal,
      progressPercent: Number(goal.progressPercent),
      remainingPercent: Math.max(0, 100 - Number(goal.progressPercent)),
      overdue: Boolean(goal.targetDate && goal.targetDate < new Date() && Number(goal.progressPercent) < 100),
    }));
  }
}
