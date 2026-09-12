import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class GoalProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async trackProgress(userId: string, goalId?: string) {
    const where = goalId
      ? { id: goalId, userId }
      : { userId, status: 'active' };
    const goals = await this.prisma.goal.findMany({
      where,
      select: { id: true, title: true, status: true, progressPercent: true, targetDate: true, updatedAt: true },
      orderBy: [{ priority: 'asc' }, { targetDate: 'asc' }],
      take: 50,
    });
    const now = Date.now();
    return goals.map((goal) => ({
      goalId: goal.id,
      title: goal.title,
      status: goal.status,
      progressPercent: Number(goal.progressPercent),
      remainingPercent: Math.max(0, 100 - Number(goal.progressPercent)),
      targetDate: goal.targetDate,
      overdue: Boolean(goal.targetDate && goal.targetDate.getTime() < now && Number(goal.progressPercent) < 100),
      updatedAt: goal.updatedAt,
    }));
  }
}
