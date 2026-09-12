import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { getDateKeyInTimezone } from '../../../common/utils/user-time';
import { CreateHabitDto, UpdateHabitDto } from '../dto/habit.dto';

type HabitFrequency = 'daily' | 'weekly';

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  async createHabit(userId: string, dto: CreateHabitDto) {
    this.validate(dto.name, dto.frequency, dto.targetPerWeek);
    return this.prisma.habit.create({ data: { userId, name: dto.name.trim(), frequency: dto.frequency ?? 'daily', targetPerWeek: dto.targetPerWeek ?? (dto.frequency === 'weekly' ? 1 : 7) } });
  }

  async getHabits(userId: string) {
    const timezone = await this.getTimezone(userId);
    const habits = await this.prisma.habit.findMany({ where: { userId, active: true }, include: { logs: { orderBy: { dateKey: 'desc' }, take: 56 } }, orderBy: { createdAt: 'asc' } });
    return habits.map((habit) => ({ ...habit, stats: this.stats(habit.logs.map((log) => log.dateKey), habit.targetPerWeek, habit.frequency as HabitFrequency, timezone) }));
  }

  async updateHabit(userId: string, id: string, dto: UpdateHabitDto) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    if (dto.name !== undefined || dto.frequency !== undefined || dto.targetPerWeek !== undefined) {
      this.validate(dto.name ?? habit.name, dto.frequency ?? (habit.frequency as HabitFrequency), dto.targetPerWeek ?? habit.targetPerWeek);
    }
    return this.prisma.habit.update({ where: { id }, data: { ...(dto.name !== undefined ? { name: dto.name.trim() } : {}), ...(dto.frequency !== undefined ? { frequency: dto.frequency } : {}), ...(dto.targetPerWeek !== undefined ? { targetPerWeek: dto.targetPerWeek } : {}), ...(dto.active !== undefined ? { active: dto.active } : {}) } });
  }

  async completeToday(userId: string, id: string, dateKey?: string) {
    const resolvedDateKey = dateKey ?? getDateKeyInTimezone(new Date(), await this.getTimezone(userId));
    this.assertDateKey(resolvedDateKey);
    const habit = await this.prisma.habit.findFirst({ where: { id, userId, active: true } });
    if (!habit) throw new NotFoundException('Habit not found');
    return this.prisma.habitLog.upsert({ where: { habitId_dateKey: { habitId: id, dateKey: resolvedDateKey } }, create: { habitId: id, userId, dateKey: resolvedDateKey }, update: { completedAt: new Date() } });
  }

  async getWeeklySummary(userId: string, dateKey?: string) {
    const timezone = await this.getTimezone(userId);
    const resolvedDateKey = dateKey ?? getDateKeyInTimezone(new Date(), timezone);
    this.assertDateKey(resolvedDateKey);
    const startKey = this.addDays(resolvedDateKey, -6);
    const streakStartKey = this.addDays(resolvedDateKey, -55);
    const habits = await this.prisma.habit.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey: { gte: streakStartKey, lte: resolvedDateKey } } } } });
    const completedCount = habits.reduce((sum, habit) => sum + habit.logs.filter((log) => log.dateKey >= startKey && log.dateKey <= resolvedDateKey).length, 0);
    const possible = habits.reduce((sum, habit) => sum + Math.min(habit.targetPerWeek, 7), 0);
    return {
      dateKey: resolvedDateKey,
      activeHabits: habits.length,
      completedCount,
      completionPercent: possible ? Math.min(100, Math.round((completedCount / possible) * 100)) : 0,
      habits: habits.map((habit) => ({
        id: habit.id,
        name: habit.name,
        targetPerWeek: habit.targetPerWeek,
        completedThisWeek: habit.logs.filter((log) => log.dateKey >= startKey && log.dateKey <= resolvedDateKey).length,
        streak: this.stats(habit.logs.map((log) => log.dateKey), habit.targetPerWeek, habit.frequency as HabitFrequency, timezone, resolvedDateKey).streak,
      })),
    };
  }

  async deleteHabit(userId: string, id: string) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    await this.prisma.habit.delete({ where: { id } });
    return { deleted: true };
  }

  private stats(keys: string[], targetPerWeek: number, frequency: HabitFrequency, timezone: string, anchorDateKey = getDateKeyInTimezone(new Date(), timezone)) {
    const set = new Set(keys);
    const streak = frequency === 'weekly' ? this.weeklyStreak(set, targetPerWeek, anchorDateKey) : this.dailyStreak(set, anchorDateKey);
    return { streak, recentCompletions: keys.length, targetPerWeek };
  }

  private dailyStreak(set: Set<string>, anchorDateKey: string) {
    let streak = 0;
    for (let i = 0; i < 56; i += 1) {
      const key = this.addDays(anchorDateKey, -i);
      if (set.has(key)) streak += 1;
      else break;
    }
    return streak;
  }

  private weeklyStreak(set: Set<string>, targetPerWeek: number, anchorDateKey: string) {
    let streak = 0;
    const currentWeekStart = this.startOfWeek(anchorDateKey);
    for (let week = 0; week < 8; week += 1) {
      const weekStart = this.addDays(currentWeekStart, week * -7);
      const completed = Array.from({ length: 7 }, (_, day) => this.addDays(weekStart, day)).filter((key) => set.has(key)).length;
      if (completed >= targetPerWeek) streak += 1;
      else break;
    }
    return streak;
  }

  private startOfWeek(key: string) {
    const date = new Date(`${key}T00:00:00.000Z`);
    const day = date.getUTCDay();
    const diff = (day + 6) % 7;
    date.setUTCDate(date.getUTCDate() - diff);
    return date.toISOString().slice(0, 10);
  }

  private validate(name: string, frequency: string, targetPerWeek?: number) {
    if (!name?.trim()) throw new BadRequestException('Habit name is required');
    if (!['daily', 'weekly'].includes(frequency)) throw new BadRequestException('frequency must be daily or weekly');
    const target = targetPerWeek ?? (frequency === 'weekly' ? 1 : 7);
    if (!Number.isInteger(target) || target < 1 || target > 7) throw new BadRequestException('targetPerWeek must be between 1 and 7');
  }

  private assertDateKey(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException('dateKey must use YYYY-MM-DD format');
  }

  private async getTimezone(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId }, select: { timezone: true } });
    return settings?.timezone || 'UTC';
  }

  private addDays(key: string, amount: number) {
    const date = new Date(`${key}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }
}
