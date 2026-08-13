import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { LearningService } from '../../user-intelligence/services/learning.service';
import { FitnessProfileService } from '../../fitness/services/fitness-profile.service';
import { BrainLifeContext } from '../types';

type GoalRow = { id: string; title: string; category: string; priority: number; progressPercent: number; targetDate: Date | null };

@Injectable()
export class BrainLifeContextService {
  constructor(private readonly prisma: PrismaService, private readonly learning: LearningService, private readonly fitness: FitnessProfileService) {}

  async getToday(userId: string, dateKey = new Date().toISOString().slice(0, 10)): Promise<BrainLifeContext & { adaptive: Awaited<ReturnType<LearningService['buildProfile']>> }> {
    const end = new Date(`${dateKey}T23:59:59.999Z`); const start = new Date(end); start.setUTCDate(start.getUTCDate() - 6);
    const [habits, pendingReminders, nextReminder, supplements, goals, adaptive, fitnessContext] = await Promise.all([
      this.prisma.habit.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey: { gte: this.key(start), lte: dateKey } } } }, orderBy: { createdAt: 'asc' } }),
      this.prisma.reminder.count({ where: { userId, completed: false } }),
      this.prisma.reminder.findFirst({ where: { userId, completed: false, scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.supplement.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey }, take: 1 } }, orderBy: [{ scheduledTime: 'asc' }, { name: 'asc' }] }),
      this.prisma.$queryRaw<GoalRow[]>`SELECT "id","title","category","priority","progressPercent","targetDate" FROM "Goal" WHERE "userId"=${userId} AND "status"='active' ORDER BY "priority" ASC, "targetDate" ASC NULLS LAST, "createdAt" ASC LIMIT 10`,
      this.learning.buildProfile(userId),
      this.fitness.buildRecommendationContext(userId),
    ]);
    const completedThisWeek = habits.reduce((sum, h) => sum + h.logs.length, 0); const possible = habits.reduce((sum, h) => sum + Math.min(h.targetPerWeek, 7), 0);
    const habitItems = habits.map(h => { const dates = new Set(h.logs.map(l => l.dateKey)); let streak = 0; for (let i = 0; i < 14; i++) { const d = new Date(`${dateKey}T00:00:00.000Z`); d.setUTCDate(d.getUTCDate() - i); if (!dates.has(this.key(d))) break; streak++; } return { id: h.id, name: h.name, targetPerWeek: h.targetPerWeek, completedThisWeek: h.logs.length, streak }; });
    const taken = supplements.filter(s => s.logs.length > 0).length;
    const goalItems = goals.map(g => ({ id: g.id, title: g.title, category: g.category, priority: g.priority, progressPercent: g.progressPercent, targetDate: g.targetDate?.toISOString() ?? null, daysRemaining: g.targetDate ? Math.ceil((g.targetDate.getTime() - end.getTime()) / 86400000) : null }));
    const dueSoon = goalItems.filter(g => g.daysRemaining !== null && g.daysRemaining >= 0 && g.daysRemaining <= 7).length;
    const averageProgress = goalItems.length ? Math.round(goalItems.reduce((s, g) => s + g.progressPercent, 0) / goalItems.length) : 0;
    return {
      habits: { active: habits.length, completedThisWeek, completionPercent: possible ? Math.min(100, Math.round(completedThisWeek / possible * 100)) : 0, currentStreak: habitItems.length ? Math.max(...habitItems.map(i => i.streak)) : 0, items: habitItems },
      reminders: { pending: pendingReminders, next: nextReminder ? { id: nextReminder.id, title: nextReminder.title, type: nextReminder.type, scheduledAt: nextReminder.scheduledAt.toISOString() } : null },
      supplements: { total: supplements.length, taken, remaining: Math.max(0, supplements.length - taken), completionPercent: supplements.length ? Math.round(taken / supplements.length * 100) : 0, next: (() => { const item = supplements.find(s => s.logs.length === 0); return item ? { id: item.id, name: item.name, dosage: item.dosage, scheduledTime: item.scheduledTime } : null; })() },
      goals: { active: goalItems.length, dueSoon, averageProgress, next: goalItems[0] ?? null, items: goalItems },
      fitness: {
        disciplines: fitnessContext.disciplines,
        primaryGoal: fitnessContext.primaryGoal ? {
          id: fitnessContext.primaryGoal.id,
          kind: fitnessContext.primaryGoal.kind,
          title: fitnessContext.primaryGoal.title,
          targetAreas: fitnessContext.primaryGoal.targetAreas,
          desiredOutcome: fitnessContext.primaryGoal.desiredOutcome,
          priority: fitnessContext.primaryGoal.priority,
          avoidBulk: fitnessContext.primaryGoal.avoidBulk,
          active: fitnessContext.primaryGoal.active,
        } : null,
        equipment: fitnessContext.equipment,
        constraints: fitnessContext.constraints.map(c => c),
        targetAreas: fitnessContext.targetAreas,
      },
      adaptive,
    };
  }

  private key(date: Date) { return date.toISOString().slice(0, 10); }
}
