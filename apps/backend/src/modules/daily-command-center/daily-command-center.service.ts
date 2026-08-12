import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { NotificationsService } from '../notifications/services/notifications.service';

@Injectable()
export class DailyCommandCenterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getToday(userId: string) {
    const dateKey = new Date().toISOString().slice(0, 10);
    const todayStart = new Date(`${dateKey}T00:00:00.000Z`);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const [profile, daily, nutritionProfile, nextReminder, pendingReminders, calendarEvents, habits, supplements, workouts, unreadNotifications] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId }, select: { primaryGoal: true } }),
      this.prisma.dailyLog.findUnique({ where: { userId_dateKey: { userId, dateKey } } }),
      this.prisma.nutritionProfile.findUnique({ where: { userId }, select: { dailyCaloriesGoal: true, proteinGoalGrams: true, waterGoalMl: true } }),
      this.prisma.reminder.findFirst({ where: { userId, completed: false, scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.reminder.count({ where: { userId, completed: false } }),
      this.prisma.reminder.findMany({
        where: { userId, type: 'calendar', completed: false, scheduledAt: { gte: todayStart, lt: tomorrowStart } },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
      this.prisma.habit.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey }, take: 1 } }, orderBy: { createdAt: 'asc' } }),
      this.prisma.supplement.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey }, take: 1 } }, orderBy: { scheduledTime: 'asc' } }),
      this.prisma.workout.findMany({ where: { userId, performedAt: { gte: todayStart } }, orderBy: { performedAt: 'desc' }, take: 3 }),
      this.notificationsService.getUnreadCount(userId),
    ]);

    const habitsDone = habits.filter((habit) => habit.logs.length > 0).length;
    const supplementsTaken = supplements.filter((item) => item.logs.length > 0).length;
    const priorities: string[] = [];

    if (unreadNotifications > 0) priorities.push(`Review ${unreadNotifications} unread assistant notification${unreadNotifications > 1 ? 's' : ''}`);
    if (calendarEvents.length > 0) priorities.push(`You have ${calendarEvents.length} scheduled event${calendarEvents.length > 1 ? 's' : ''} today`);
    if (!daily) priorities.push('Start your daily log');
    if (nutritionProfile?.waterGoalMl && (daily?.waterMl ?? 0) < nutritionProfile.waterGoalMl * 0.5) priorities.push('Catch up on water');
    if (nutritionProfile?.proteinGoalGrams && (daily?.protein ?? 0) < nutritionProfile.proteinGoalGrams * 0.5) priorities.push('Boost your protein');
    if (habits.length && habitsDone < habits.length) priorities.push(`Complete ${habits.length - habitsDone} habit${habits.length - habitsDone > 1 ? 's' : ''}`);
    if (supplements.length && supplementsTaken < supplements.length) priorities.push(`Take ${supplements.length - supplementsTaken} supplement${supplements.length - supplementsTaken > 1 ? 's' : ''}`);
    if (nextReminder) priorities.push(`Next reminder: ${nextReminder.title}`);
    if (!workouts.length) priorities.push('Add a little movement today');

    return {
      dateKey,
      greeting: profile?.primaryGoal ? `Today is about moving toward ${profile.primaryGoal}.` : 'Let’s make today a good one.',
      primaryGoal: profile?.primaryGoal ?? null,
      priorities: priorities.slice(0, 4),
      nutrition: {
        calories: daily?.calories ?? 0,
        calorieGoal: nutritionProfile?.dailyCaloriesGoal ?? null,
        protein: daily?.protein ?? 0,
        proteinGoal: nutritionProfile?.proteinGoalGrams ?? null,
        waterMl: daily?.waterMl ?? 0,
        waterGoalMl: nutritionProfile?.waterGoalMl ?? null,
      },
      habits: { total: habits.length, completed: habitsDone },
      supplements: { total: supplements.length, taken: supplementsTaken },
      reminders: { pending: pendingReminders, next: nextReminder ? { id: nextReminder.id, title: nextReminder.title, type: nextReminder.type, scheduledAt: nextReminder.scheduledAt.toISOString() } : null },
      calendar: {
        today: calendarEvents.map((event) => ({
          id: event.id,
          title: event.title,
          type: event.type,
          scheduledAt: event.scheduledAt.toISOString(),
          completed: event.completed,
        })),
        next: calendarEvents[0] ? {
          id: calendarEvents[0].id,
          title: calendarEvents[0].title,
          type: calendarEvents[0].type,
          scheduledAt: calendarEvents[0].scheduledAt.toISOString(),
          completed: calendarEvents[0].completed,
        } : null,
      },
      notifications: { unread: unreadNotifications },
      workouts: { countToday: workouts.length, latest: workouts[0] ? { name: workouts[0].name, type: workouts[0].type, durationMinutes: workouts[0].durationMinutes } : null },
    };
  }
}
