import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateHabitDto, UpdateHabitDto } from '../dto/habit.dto';

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  async createHabit(userId: string, dto: CreateHabitDto) {
    this.validate(dto.name, dto.frequency, dto.targetPerWeek);
    return this.prisma.habit.create({ data: { userId, name: dto.name.trim(), frequency: dto.frequency ?? 'daily', targetPerWeek: dto.targetPerWeek ?? (dto.frequency === 'weekly' ? 1 : 7) } });
  }

  async getHabits(userId: string) {
    const habits = await this.prisma.habit.findMany({ where: { userId, active: true }, include: { logs: { orderBy: { dateKey: 'desc' }, take: 14 } }, orderBy: { createdAt: 'asc' } });
    return habits.map((habit) => ({ ...habit, stats: this.stats(habit.logs.map((log) => log.dateKey), habit.targetPerWeek) }));
  }

  async updateHabit(userId: string, id: string, dto: UpdateHabitDto) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    if (dto.name !== undefined || dto.frequency !== undefined || dto.targetPerWeek !== undefined) this.validate(dto.name ?? habit.name, dto.frequency ?? habit.frequency, dto.targetPerWeek ?? habit.targetPerWeek);
    return this.prisma.habit.update({ where: { id }, data: { ...(dto.name !== undefined ? { name: dto.name.trim() } : {}), ...(dto.frequency !== undefined ? { frequency: dto.frequency } : {}), ...(dto.targetPerWeek !== undefined ? { targetPerWeek: dto.targetPerWeek } : {}), ...(dto.active !== undefined ? { active: dto.active } : {}) } });
  }

  async completeToday(userId: string, id: string, dateKey = this.todayKey()) {
    this.assertDateKey(dateKey);
    const habit = await this.prisma.habit.findFirst({ where: { id, userId, active: true } });
    if (!habit) throw new NotFoundException('Habit not found');
    return this.prisma.habitLog.upsert({ where: { habitId_dateKey: { habitId: id, dateKey } }, create: { habitId: id, userId, dateKey }, update: { completedAt: new Date() } });
  }

  async getWeeklySummary(userId: string, dateKey = this.todayKey()) {
    this.assertDateKey(dateKey);
    const end = new Date(`${dateKey}T23:59:59.999Z`); const start = new Date(end); start.setUTCDate(start.getUTCDate() - 6);
    const habits = await this.prisma.habit.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey: { gte: this.key(start), lte: dateKey } } } } });
    const completedCount = habits.reduce((sum, habit) => sum + habit.logs.length, 0);
    const possible = habits.reduce((sum, habit) => sum + Math.min(habit.targetPerWeek, 7), 0);
    return { dateKey, activeHabits: habits.length, completedCount, completionPercent: possible ? Math.min(100, Math.round((completedCount / possible) * 100)) : 0, habits: habits.map((habit) => ({ id: habit.id, name: habit.name, targetPerWeek: habit.targetPerWeek, completedThisWeek: habit.logs.length, streak: this.stats(habit.logs.map((log) => log.dateKey), habit.targetPerWeek).streak })) };
  }

  async deleteHabit(userId: string, id: string) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    await this.prisma.habit.delete({ where: { id } });
    return { deleted: true };
  }

  private stats(keys: string[], targetPerWeek: number) {
    const set = new Set(keys); let streak = 0;
    for (let i = 0; i < 14; i += 1) { const d = new Date(); d.setUTCDate(d.getUTCDate() - i); if (set.has(d.toISOString().slice(0, 10))) streak += 1; else break; }
    return { streak, recentCompletions: keys.length, targetPerWeek };
  }

  private validate(name: string, frequency: string, targetPerWeek?: number) {
    if (!name?.trim()) throw new BadRequestException('Habit name is required');
    if (!['daily', 'weekly'].includes(frequency)) throw new BadRequestException('frequency must be daily or weekly');
    const target = targetPerWeek ?? (frequency === 'weekly' ? 1 : 7);
    if (!Number.isInteger(target) || target < 1 || target > 7) throw new BadRequestException('targetPerWeek must be between 1 and 7');
  }

  private assertDateKey(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException('dateKey must use YYYY-MM-DD format'); }
  private todayKey() { return new Date().toISOString().slice(0, 10); }
  private key(date: Date) { return date.toISOString().slice(0, 10); }
}
