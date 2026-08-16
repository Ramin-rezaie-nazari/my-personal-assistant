import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { LearningService } from '../../user-intelligence/services/learning.service';
import { DecisionOutcomeLearningService } from './decision-outcome-learning.service';

type Candidate = {
  id: string;
  title: string;
  priority: number;
  estimatedMinutes: number;
  energyLevel: string;
  dueAt: Date | null;
  scheduledAt: Date | null;
  goalId: string | null;
  score: number;
  reasons: string[];
};
type TaskRow = {
  id: string;
  title: string;
  priority: number;
  estimatedMinutes: number;
  energyLevel: string;
  dueAt: Date | null;
  scheduledAt: Date | null;
  goalId: string | null;
  goalTitle: string | null;
  dependencyStatus: string[];
};

@Injectable()
export class SmartPlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learning: LearningService,
    private readonly outcomeLearning: DecisionOutcomeLearningService,
  ) {}

  async getPlan(userId: string, date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const prismaRecord = this.prisma as unknown as {
      lifeTask?: { findMany?: Function };
    };
    const taskQuery = prismaRecord.lifeTask?.findMany
      ? prismaRecord.lifeTask.findMany({
          where: {
            userId,
            status: { in: ['pending', 'in_progress'] },
            OR: [
              { scheduledAt: { gte: start, lt: end } },
              { scheduledAt: null },
            ],
          },
          include: {
            goal: true,
            dependencies: { include: { dependsOnTask: true } },
          },
          orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
        })
      : this.prisma.$queryRaw<TaskRow[]>`
        SELECT t."id", t."title", t."priority", COALESCE(t."estimatedMinutes", 0) AS "estimatedMinutes", t."energy" AS "energyLevel",
               t."dueAt", t."scheduledAt", t."goalId", g."title" AS "goalTitle",
               COALESCE(array_agg(dep."status") FILTER (WHERE dep."id" IS NOT NULL), ARRAY[]::text[]) AS "dependencyStatus"
        FROM "LifeTask" t
        LEFT JOIN "Goal" g ON g."id" = t."goalId"
        LEFT JOIN "TaskDependency" d ON d."taskId" = t."id"
        LEFT JOIN "LifeTask" dep ON dep."id" = d."dependsOnTaskId"
        WHERE t."userId"=${userId} AND t."status" IN ('pending','in_progress')
          AND (t."scheduledAt" >= ${start} AND t."scheduledAt" < ${end} OR t."scheduledAt" IS NULL)
        GROUP BY t."id", g."title"
        ORDER BY t."priority" ASC, t."dueAt" ASC NULLS LAST`;
    const [tasks, adaptive] = await Promise.all([
      taskQuery,
      this.learning.buildProfile(userId),
    ]);
    const now = new Date(date);
    const currentHour = now.getHours();
    const candidates: Candidate[] = tasks.map((task: any) => {
      const dependencyStatus: string[] =
        task.dependencyStatus ??
        task.dependencies
          ?.map((d: any) => d.dependsOnTask?.status)
          .filter(Boolean) ??
        [];
      const goalTitle = task.goalTitle ?? task.goal?.title ?? null;
      const reasons: string[] = [];
      let score = (4 - Math.min(task.priority, 3)) * 20;
      if (task.dueAt && task.dueAt <= end) {
        score += task.dueAt < start ? 40 : 30;
        reasons.push(task.dueAt < start ? 'overdue' : 'due today');
      }
      if (
        task.dueAt &&
        task.dueAt > start &&
        task.dueAt < new Date(end.getTime() + 24 * 60 * 60000)
      ) {
        score += 8;
        reasons.push('deadline is approaching');
      }
      if (task.goalId && goalTitle) {
        score += 8;
        reasons.push('supports an active goal');
      }
      if (
        adaptive.preferredTaskMinutes &&
        Math.abs(
          (task.estimatedMinutes ?? 0) - adaptive.preferredTaskMinutes,
        ) <= 10
      ) {
        score += 8;
        reasons.push('matches your usual task size');
      }
      if (adaptive.bestHours?.includes(currentHour)) {
        score += 5;
        reasons.push('current hour matches a strong completion window');
      }
      if (
        task.scheduledAt &&
        task.scheduledAt >= start &&
        task.scheduledAt < end
      ) {
        score += 12;
        reasons.push('scheduled today');
      }
      const blocked = dependencyStatus.some((status) => status !== 'completed');
      if (blocked) {
        score -= 100;
        reasons.push('blocked by another task');
      }
      if (adaptive.snoozeRate >= 0.5 && (task.estimatedMinutes ?? 0) > 90) {
        score -= 8;
        reasons.push('long task is less suitable when snooze rate is high');
      }
      if (adaptive.acceptanceRate >= 0.7 && task.priority <= 1) {
        score += 4;
        reasons.push('matches a pattern of accepting important suggestions');
      }
      return {
        id: task.id,
        title: task.title,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes ?? 0,
        energyLevel: task.energyLevel ?? task.energy ?? 'medium',
        dueAt: task.dueAt,
        scheduledAt: task.scheduledAt,
        goalId: task.goalId,
        score,
        reasons,
      };
    });

    const outcomeAdjustments = await this.outcomeLearning.decisionAdjustments(
      userId,
      candidates.map((candidate) => candidate.id),
    );
    for (const candidate of candidates) {
      const adjustment = outcomeAdjustments[candidate.id] ?? 0;
      if (adjustment > 0) {
        candidate.score += Math.round(adjustment * 100);
        candidate.reasons.push('has a stable positive outcome history');
      } else if (adjustment < 0) {
        candidate.score += Math.round(adjustment * 100);
        candidate.reasons.push('has a stable negative outcome history');
      }
    }

    candidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    const actionable = candidates.filter(
      (c) => !c.reasons.includes('blocked by another task'),
    );
    const best = actionable[0] ?? null;
    return {
      date: start.toISOString().slice(0, 10),
      bestAction: best,
      alternatives: actionable.filter((c) => c.id !== best?.id).slice(0, 4),
      blocked: candidates
        .filter((c) => c.reasons.includes('blocked by another task'))
        .slice(0, 10),
      adaptive: {
        bestHours: adaptive.bestHours,
        preferredTaskMinutes: adaptive.preferredTaskMinutes,
        snoozeRate: adaptive.snoozeRate,
        acceptanceRate: adaptive.acceptanceRate,
      },
    };
  }

  async replan(userId: string, date = new Date()) {
    const plan = await this.getPlan(userId, date);
    if (!plan.bestAction) return plan;
    if (!plan.bestAction.scheduledAt) {
      const preferred =
        plan.adaptive.bestHours.find((h) => h > new Date().getHours()) ??
        plan.adaptive.bestHours[0];
      if (preferred !== undefined) {
        const scheduled = new Date(date);
        scheduled.setHours(preferred, 0, 0, 0);
        if (scheduled > new Date()) {
          const prismaRecord = this.prisma as unknown as {
            lifeTask?: { update?: Function };
          };
          if (prismaRecord.lifeTask?.update)
            await prismaRecord.lifeTask.update({
              where: { id: plan.bestAction.id },
              data: { scheduledAt: scheduled },
            });
          else
            await this.prisma
              .$executeRaw`UPDATE "LifeTask" SET "scheduledAt"=${scheduled}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${plan.bestAction.id} AND "userId"=${userId}`;
        }
      }
    }
    return this.getPlan(userId, date);
  }
}
