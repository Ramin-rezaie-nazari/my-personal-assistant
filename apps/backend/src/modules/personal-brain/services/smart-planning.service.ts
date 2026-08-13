import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { LearningService } from '../../user-intelligence/services/learning.service';

type TaskPlanRow = { id: string; title: string; priority: number; estimatedMinutes: number | null; energy: string; dueAt: Date | null; scheduledAt: Date | null; goalId: string | null; blocked: boolean };
type Candidate = { id: string; title: string; priority: number; estimatedMinutes: number; energyLevel: string; dueAt: Date | null; scheduledAt: Date | null; goalId: string | null; score: number; reasons: string[] };

@Injectable()
export class SmartPlanningService {
  constructor(private readonly prisma: PrismaService, private readonly learning: LearningService) {}

  async getPlan(userId: string, date = new Date()) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const [tasks, adaptive] = await Promise.all([
      this.prisma.$queryRaw<TaskPlanRow[]>`
        SELECT t."id", t."title", t."priority", t."estimatedMinutes", t."energy", t."dueAt", t."scheduledAt", t."goalId",
          EXISTS (
            SELECT 1 FROM "TaskDependency" d
            JOIN "LifeTask" dep ON dep."id" = d."dependsOnTaskId"
            WHERE d."taskId" = t."id" AND dep."status" <> 'completed'
          ) AS "blocked"
        FROM "LifeTask" t
        WHERE t."userId" = ${userId}
          AND t."status" IN ('pending','in_progress')
          AND (t."scheduledAt" IS NULL OR (t."scheduledAt" >= ${start} AND t."scheduledAt" < ${end}))
        ORDER BY t."priority" ASC, t."dueAt" ASC NULLS LAST
      `,
      this.learning.buildProfile(userId),
    ]);
    const now = new Date(date);
    const currentHour = now.getHours();
    const candidates: Candidate[] = tasks.map((task) => {
      const reasons: string[] = [];
      const estimatedMinutes = task.estimatedMinutes ?? 30;
      let score = (4 - Math.min(task.priority, 3)) * 20;
      if (task.dueAt && task.dueAt <= end) { score += task.dueAt < start ? 40 : 30; reasons.push(task.dueAt < start ? 'overdue' : 'due today'); }
      if (task.dueAt && task.dueAt > start && task.dueAt < new Date(end.getTime() + 24 * 60 * 60000)) { score += 8; reasons.push('deadline is approaching'); }
      if (task.goalId) { score += 8; reasons.push('supports an active goal'); }
      if (adaptive.preferredTaskMinutes && Math.abs(estimatedMinutes - adaptive.preferredTaskMinutes) <= 10) { score += 8; reasons.push('matches your usual task size'); }
      if (adaptive.bestHours?.includes(currentHour)) { score += 5; reasons.push('current hour matches a strong completion window'); }
      if (task.scheduledAt && task.scheduledAt >= start && task.scheduledAt < end) { score += 12; reasons.push('scheduled today'); }
      if (task.blocked) { score -= 100; reasons.push('blocked by another task'); }
      if (adaptive.snoozeRate >= 0.5 && estimatedMinutes > 90) { score -= 8; reasons.push('long task is less suitable when snooze rate is high'); }
      if (adaptive.acceptanceRate >= 0.7 && task.priority <= 1) { score += 4; reasons.push('matches a pattern of accepting important suggestions'); }
      return { id: task.id, title: task.title, priority: task.priority, estimatedMinutes, energyLevel: task.energy, dueAt: task.dueAt, scheduledAt: task.scheduledAt, goalId: task.goalId, score, reasons };
    }).sort((a, b) => b.score - a.score);
    const actionable = candidates.filter(c => !c.reasons.includes('blocked by another task'));
    const best = actionable[0] ?? null;
    return { date: start.toISOString().slice(0, 10), bestAction: best, alternatives: actionable.filter(c => c.id !== best?.id).slice(0, 4), blocked: candidates.filter(c => c.reasons.includes('blocked by another task')).slice(0, 10), adaptive: { bestHours: adaptive.bestHours, preferredTaskMinutes: adaptive.preferredTaskMinutes, snoozeRate: adaptive.snoozeRate, acceptanceRate: adaptive.acceptanceRate } };
  }

  async replan(userId: string, date = new Date()) {
    const plan = await this.getPlan(userId, date);
    if (!plan.bestAction) return plan;
    if (!plan.bestAction.scheduledAt) {
      const preferred = plan.adaptive.bestHours.find(h => h > new Date().getHours()) ?? plan.adaptive.bestHours[0];
      if (preferred !== undefined) {
        const scheduled = new Date(date); scheduled.setHours(preferred, 0, 0, 0);
        if (scheduled > new Date()) await this.prisma.$executeRaw`UPDATE "LifeTask" SET "scheduledAt" = ${scheduled}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${plan.bestAction.id} AND "userId" = ${userId}`;
      }
    }
    return this.getPlan(userId, date);
  }
}
