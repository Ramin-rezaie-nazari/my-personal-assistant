import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type ReminderSummary = {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  completed: boolean;
};

type ReminderPatch = { title?: string; time?: string };

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async createReminder(userId: string, dto: { title: string; type: string; time: string }) {
    const title = dto.title.trim();
    if (!title) throw new BadRequestException('title is required');
    const type = dto.type.trim() || 'general';
    const timezone = await this.getUserTimezone(userId);
    const scheduledAt = this.parseTime(dto.time, timezone);
    return this.prisma.reminder.create({ data: { userId, title, type, scheduledAt } }).then((item) => this.toSummary(item));
  }

  async getReminders(userId: string, includeCompleted = false) {
    const reminders = await this.prisma.reminder.findMany({
      where: includeCompleted ? { userId } : { userId, completed: false },
      orderBy: [{ completed: 'asc' }, { scheduledAt: 'asc' }],
    });
    return reminders.map((item) => this.toSummary(item));
  }

  async completeReminder(userId: string, reminderId: string) {
    const result = await this.prisma.reminder.updateMany({
      where: { id: reminderId, userId, completed: false },
      data: { completed: true },
    });
    if (result.count === 0) {
      const exists = await this.prisma.reminder.findFirst({ where: { id: reminderId, userId }, select: { id: true } });
      if (!exists) throw new NotFoundException('Reminder not found');
    }
    return { id: reminderId, completed: true };
  }

  async reopenReminder(userId: string, reminderId: string) {
    const result = await this.prisma.reminder.updateMany({
      where: { id: reminderId, userId, completed: true },
      data: { completed: false },
    });
    if (result.count === 0) {
      const exists = await this.prisma.reminder.findFirst({ where: { id: reminderId, userId }, select: { id: 'id' } as never });
      if (!exists) throw new NotFoundException('Reminder not found');
    }
    return { id: reminderId, completed: false };
  }

  async updateReminder(userId: string, reminderId: string, patch: ReminderPatch) {
    if (patch.title === undefined && patch.time === undefined) throw new BadRequestException('at least one field is required');
    const title = patch.title?.trim();
    if (patch.title !== undefined && !title) throw new BadRequestException('title cannot be empty');
    const timezone = await this.getUserTimezone(userId);
    const scheduledAt = patch.time ? this.parseTime(patch.time, timezone) : undefined;
    const result = await this.prisma.reminder.updateMany({
      where: { id: reminderId, userId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(scheduledAt ? { scheduledAt } : {}),
      },
    });
    if (result.count === 0) throw new NotFoundException('Reminder not found');
    return this.prisma.reminder.findFirstOrThrow({ where: { id: reminderId, userId } }).then((item) => this.toSummary(item));
  }

  async deleteReminder(userId: string, reminderId: string) {
    const result = await this.prisma.reminder.deleteMany({ where: { id: reminderId, userId } });
    if (result.count === 0) throw new NotFoundException('Reminder not found');
    return { id: reminderId, deleted: true };
  }

  async getNextReminder(userId: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { userId, completed: false, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: 'asc' },
    });
    return reminder ? this.toSummary(reminder) : null;
  }

  private async getUserTimezone(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId }, select: { timezone: true } });
    return settings?.timezone || 'UTC';
  }

  private parseTime(value: string, timezone: string): Date {
    if (!/^\d{2}:\d{2}$/.test(value)) throw new BadRequestException('time must use HH:MM format');
    const [hours, minutes] = value.split(':').map(Number);
    if (hours > 23 || minutes > 59) throw new BadRequestException('time must be a valid time');
    let candidate = this.zonedDateForLocalTime(new Date(), hours, minutes, timezone);
    if (candidate.getTime() < Date.now()) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      candidate = this.zonedDateForLocalTime(tomorrow, hours, minutes, timezone);
    }
    return candidate;
  }

  private zonedDateForLocalTime(reference: Date, hours: number, minutes: number, timezone: string) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(reference);
      const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
      const wall = Date.UTC(values.year, values.month - 1, values.day, hours, minutes, 0, 0);
      const offsetParts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(wall));
      const offsetValues = Object.fromEntries(offsetParts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
      const renderedAsUtc = Date.UTC(offsetValues.year, offsetValues.month - 1, offsetValues.day, offsetValues.hour, offsetValues.minute, offsetValues.second, 0);
      return new Date(wall - (renderedAsUtc - wall));
    } catch {
      throw new BadRequestException('invalid user timezone');
    }
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
