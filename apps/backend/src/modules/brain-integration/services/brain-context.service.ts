import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { BrainContext } from '../types';

@Injectable()
export class BrainContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getContext(userId: string, requestedDateKey?: string): Promise<BrainContext> {
    const dateKey = requestedDateKey ?? new Date().toISOString().slice(0, 10);
    const start = new Date(`${dateKey}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const [profile, daily, nutritionProfile, habits, supplements, pendingReminders, nextReminder, calendarToday, calendarNext, workouts, unreadNotifications] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId }, select: { primaryGoal: true } }),
      this.prisma.dailyLog.findUnique({ where: { userId_dateKey: { userId, dateKey } } }),
      this.prisma.nutritionProfile.findUnique({ where: { userId }, select: { dailyCaloriesGoal: true, proteinGoalGrams: true, waterGoalMl: true } }),
      this.prisma.habit.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey }, take: 1 } }, orderBy: { createdAt: 'asc' } }),
      this.prisma.supplement.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey }, take: 1 } }, orderBy: { scheduledTime: 'asc' } }),
      this.prisma.reminder.count({ where: { userId, completed: false } }),
      this.prisma.reminder.findFirst({ where: { userId, completed: false, scheduledAt: { gte: start } }, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.reminder.findMany({ where: { userId, completed: false, scheduledAt: { gte: start, lt: end } }, orderBy: { scheduledAt: 'asc' }, take: 20 }),
      this.prisma.reminder.findFirst({ where: { userId, completed: false, scheduledAt: { gte: start } }, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.workout.findMany({ where: { userId, performedAt: { gte: start, lt: end } }, orderBy: { performedAt: 'desc' }, take: 3 }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    const habitsCompleted = habits.filter((habit) => habit.logs.length > 0).length;
    const supplementsTaken = supplements.filter((supplement) => supplement.logs.length > 0).length;
    const priorities: string[] = [];

    if (unreadNotifications > 0) priorities.push(`Review ${unreadNotifications} unread assistant notification${unreadNotifications > 1 ? 's' : ''}`);
    if (!daily) priorities.push('Start your daily log');
    if (nutritionProfile?.waterGoalMl && (daily?.waterMl ?? 0) < nutritionProfile.waterGoalMl * 0.5) priorities.push('Catch up on water');
    if (nutritionProfile?.proteinGoalGrams && (daily?.protein ?? 0) < nutritionProfile.proteinGoalGrams * 0.5) priorities.push('Boost your protein');
    if (habits.length && habitsCompleted < habits.length) priorities.push(`Complete ${habits.length - habitsCompleted} habit${habits.length - habitsCompleted > 1 ? 's' : ''}`);
    if (supplements.length && supplementsTaken < supplements.length) priorities.push(`Take ${supplements.length - supplementsTaken} supplement${supplements.length - supplementsTaken > 1 ? 's' : ''}`);
    if (calendarToday.length) priorities.push(`You have ${calendarToday.length} scheduled event${calendarToday.length > 1 ? 's' : ''} today`);
    if (nextReminder) priorities.push(`Next reminder: ${nextReminder.title}`);
    if (!workouts.length) priorities.push('Add a little movement today');

    const hasActivity = Boolean(
      daily?.calories || daily?.protein || daily?.waterMl || habitsCompleted || supplementsTaken ||
      calendarToday.length || workouts.length || unreadNotifications || nextReminder,
    );

    return {
      timestamp: new Date().toISOString(),
      dateKey,
      primaryGoal: profile?.primaryGoal ?? null,
      hasActivity,
      today: {
        calories: daily?.calories ?? 0,
        calorieGoal: nutritionProfile?.dailyCaloriesGoal ?? null,
        protein: daily?.protein ?? 0,
        proteinGoal: nutritionProfile?.proteinGoalGrams ?? null,
        waterMl: daily?.waterMl ?? 0,
        waterGoalMl: nutritionProfile?.waterGoalMl ?? null,
      },
      habits: {
        active: habits.length,
        completed: habitsCompleted,
        streaks: habits.map((habit) => habit.logs.length),
      },
      supplements: {
        active: supplements.length,
        taken: supplementsTaken,
        remaining: Math.max(0, supplements.length - supplementsTaken),
      },
      reminders: {
        pending: pendingReminders,
        next: nextReminder ? { id: nextReminder.id, title: nextReminder.title, type: nextReminder.type, scheduledAt: nextReminder.scheduledAt.toISOString() } : null,
      },
      calendar: {
        todayCount: calendarToday.length,
        next: calendarNext ? { id: calendarNext.id, title: calendarNext.title, startsAt: calendarNext.scheduledAt.toISOString(), endsAt: null, completed: calendarNext.completed } : null,
      },
      workouts: {
        todayCount: workouts.length,
        latest: workouts[0] ? { id: workouts[0].id, name: workouts[0].name, type: workouts[0].type, durationMinutes: workouts[0].durationMinutes, caloriesBurned: workouts[0].caloriesBurned, performedAt: workouts[0].performedAt.toISOString() } : null,
      },
      notifications: { unread: unreadNotifications },
      priorities: priorities.slice(0, 5),
      source: 'brain-context',
    };
  }
}
