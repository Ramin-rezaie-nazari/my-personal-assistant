import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { BrainLifeContext } from '../types';

type GoalRow = { id: string; title: string; category: string; priority: number; progressPercent: number; targetDate: Date | null };

@Injectable()
export class BrainLifeContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday(userId: string, dateKey = new Date().toISOString().slice(0, 10)): Promise<BrainLifeContext> {
    const end = new Date(`${dateKey}T23:59:59.999Z`);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);

    const [habits, pendingReminders, nextReminder, supplements, goals] = await Promise.all([
      this.prisma.habit.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey: { gte: this.key(start), lte: dateKey } } } }, orderBy: { createdAt: 'asc' } }),
      this.prisma.reminder.count({ where: { userId, completed: false } }),
      this.prisma.reminder.findFirst({ where: { userId, completed: false, scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.supplement.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey }, take: 1 } }, orderBy: [{ scheduledTime: 'asc' }, { name: 'asc' }] }),
      this.prisma.$queryRaw<GoalRow[]>`SELECT "id","title","category","priority","progressPercent","targetDate" FROM "Goal" WHERE "userId"=${userId} AND "status"='active' ORDER BY "priority" ASC, "targetDate" ASC NULLS LAST, "createdAt" ASC LIMIT 10`,
    ]);

    const completedThisWeek = habits.reduce((sum, habit) => sum + habit.logs.length, 0);
    const possible = habits.reduce((sum, habit) => sum + Math.min(habit.targetPerWeek, 7), 0);
    const habitItems = habits.map((habit) => {
      const dates = new Set(habit.logs.map((log) => log.dateKey));
      let streak = 0;
      for (let i = 0; i < 14; i += 1) { const d = new Date(`${dateKey}T00:00:00.000Z`); d.setUTCDate(d.getUTCDate() - i); if (!dates.has(this.key(d))) break; streak += 1; }
      return { id: habit.id, name: habit.name, targetPerWeek: habit.targetPerWeek, completedThisWeek: habit.logs.length, streak };
    });

    const taken = supplements.filter((item) => item.logs.length > 0).length;
    const goalItems = goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      category: goal.category,
      priority: goal.priority,
      progressPercent: goal.progressPercent,
      targetDate: goal.targetDate?.toISOString() ?? null,
      daysRemaining: goal.targetDate ? Math.ceil((goal.targetDate.getTime() - end.getTime()) / 86400000) : null,
    }));
    const dueSoon = goalItems.filter((goal) => goal.daysRemaining !== null && goal.daysRemaining >= 0 && goal.daysRemaining <= 7).length;
    const averageProgress = goalItems.length ? Math.round(goalItems.reduce((sum, goal) => sum + goal.progressPercent, 0) / goalItems.length) : 0;

    return {
      habits: { active: habits.length, completedThisWeek, completionPercent: possible ? Math.min(100, Math.round((completedThisWeek / possible) * 100)) : 0, currentStreak: habitItems.length ? Math.max(...habitItems.map((item) => item.streak)) : 0, items: habitItems },
      reminders: { pending: pendingReminders, next: nextReminder ? { id: nextReminder.id, title: nextReminder.title, type: nextReminder.type, scheduledAt: nextReminder.scheduledAt.toISOString() } : null },
      supplements: { total: supplements.length, taken, remaining: Math.max(0, supplements.length - taken), completionPercent: supplements.length ? Math.round((taken / supplements.length) * 100) : 0, next: supplements.find((item) => item.logs.length === 0) ? (() => { const item = supplements.find((supplement) => supplement.logs.length === 0)!; return { id: item.id, name: item.name, dosage: item.dosage, scheduledTime: item.scheduledTime }; })() : null },
      goals: { active: goalItems.length, dueSoon, averageProgress, next: goalItems[0] ?? null, items: goalItems },
    };
  }

  private key(date: Date) { return date.toISOString().slice(0, 10); }
}
