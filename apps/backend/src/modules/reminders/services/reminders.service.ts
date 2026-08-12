import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type ReminderSummary = {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  completed: boolean;
};

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async createReminder(userId: string, dto: { title: string; type: string; time: string }) {
    const title = dto.title.trim();
    if (!title) throw new BadRequestException('title is required');
    const type = dto.type.trim() || 'general';
    const scheduledAt = this.parseTime(dto.time);
    return this.prisma.reminder.create({ data: { userId, title, type, scheduledAt } });
  }

  async getReminders(userId: string, includeCompleted = false) {
    const reminders = await this.prisma.reminder.findMany({
      where: includeCompleted ? { userId } : { userId, completed: false },
      orderBy: { scheduledAt: 'asc' },
    });
    return reminders.map((item) => this.toSummary(item));
  }

  async completeReminder(userId: string, reminderId: string) {
    const result = await this.prisma.reminder.updateMany({
      where: { id: reminderId, userId },
      data: { completed: true },
    });
    if (result.count === 0) throw new NotFoundException('Reminder not found');
    return { completed: true };
  }

  async deleteReminder(userId: string, reminderId: string) {
    const result = await this.prisma.reminder.deleteMany({ where: { id: reminderId, userId } });
    if (result.count === 0) throw new NotFoundException('Reminder not found');
    return { deleted: true };
  }

  async getNextReminder(userId: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { userId, completed: false, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: 'asc' },
    });
    return reminder ? this.toSummary(reminder) : null;
  }

  private parseTime(value: string): Date {
    if (!/^\d{2}:\d{2}$/.test(value)) throw new BadRequestException('time must use HH:MM format');
    const [hours, minutes] = value.split(':').map(Number);
    if (hours > 23 || minutes > 59) throw new BadRequestException('time must be a valid time');
    const result = new Date();
    result.setHours(hours, minutes, 0, 0);
    if (result.getTime() < Date.now()) result.setDate(result.getDate() + 1);
    return result;
  }

  private toSummary(reminder: { id: string; title: string; type: string; scheduledAt: Date; completed: boolean }): ReminderSummary {
    return {
      id: reminder.id,
      title: reminder.title,
      type: reminder.type,
      scheduledAt: reminder.scheduledAt.toISOString(),
      completed: reminder.completed,
    };
  }
}
