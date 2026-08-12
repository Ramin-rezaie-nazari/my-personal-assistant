import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class DailyCommandCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday(userId: string) {
    const dateKey = new Date().toISOString().slice(0, 10);
    const [profile, daily, nextReminder, pendingReminders, habits, supplements, workouts] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId }, select: { primaryGoal: true } }),
      this.prisma.dailyLog.findUnique({ where: { userId_dateKey: { userId, dateKey } } }),
      this.prisma.reminder.findFirst({ where: { userId, completed: false, scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.reminder.count({ where: { userId, completed: false } }),
      this.prisma.habit.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey }, take: 1 } }, orderBy: { createdAt: 'asc' } }),
      this.prisma.supplement.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey }, take: 1 } }, orderBy: { scheduledTime: 'asc' } }),
      this.prisma.workout.findMany({ where: { userId, performedAt: { gte: new Date(`${dateKey}T00:00:00.000Z`) } }, orderBy: { performedAt: 'desc' }, take: 3 }),
    ]);

    const caloriesGoal = await this.prisma.nutritionProfile.findUnique({ where: { userId }, select: { dailyCaloriesGoal: true, proteinGoalGrams: true, waterGoalMl: true } });
    const habitsDone = habits.filter((habit) => habit.logs.length > 0).length;
    const supplementsTaken = supplements.filter((item) => item.logs.length > 0).length;

    const priorities: string[] = [];
    if (!daily) priorities.push('Start your daily log');
    if (caloriesGoal?.waterGoalMl && (daily?.waterMl ?? 0) < caloriesGoal.waterGoalMl * 0.5) priorities.push('Catch up on water');
    if (habits.length && habitsDone < habits.length) priorities.push(`Complete ${habits.length - habitsDone} habit${habits.length - habitsDone > 1 ? 's' : ''}`);
    if (supplements.length && supplementsTaken < supplements.length) priorities.push(`Take ${supplements.length - supplementsTaken} supplement${supplements.length - supplementsTaken > 1 ? 's' : ''}`);
    if (nextReminder) priorities.push(`Next reminder: ${nextReminder.title}`);
    if (!workouts.length) priorities.push('Add a little movement today');

    const greeting = profile?.primaryGoal
      ? `Today is about moving toward ${profile.primaryGoal}.`
      : 'Let’s make today a good one.';

    return {
      dateKey,
      greeting,
      primaryGoal: profile?.primaryGoal ?? null,
      priorities: priorities.slice(0, 4),
      nutrition: {
        calories: daily?.calories ?? 0,
        calorieGoal: caloriesGoal?.dailyCaloriesGoal ?? null,
        protein: daily?.protein ?? 0,
        proteinGoal: caloriesGoal?.proteinGoalGrams ?? null,
        waterMl: daily?.waterMl ?? 0,
        waterGoalMl: caloriesGoal?.waterGoalMl ?? null,
      },
      habits: { total: habits.length, completed: habitsDone },
      supplements: { total: supplements.length, taken: supplementsTaken },
      reminders: { pending: pendingReminders, next: nextReminder ? { id: nextReminder.id, title: nextReminder.title, type: nextReminder.type, scheduledAt: nextReminder.scheduledAt.toISOString() } : null },
      workouts: { countToday: workouts.length, latest: workouts[0] ? { name: workouts[0].name, type: workouts[0].type, durationMinutes: workouts[0].durationMinutes } : null },
    };
  }
}
