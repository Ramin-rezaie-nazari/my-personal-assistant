import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type CalendarEvent = {
  id: string;
  title: string;
  type: string;
  startsAt: string;
  endsAt: string | null;
  completed: boolean;
};

type CalendarPatch = { title?: string; type?: string; startsAt?: string; endsAt?: string | null };

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(userId: string, data: { title: string; type: string; startsAt: string; endsAt?: string }) {
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    if (!title) throw new BadRequestException('title is required');
    const type = typeof data.type === 'string' ? data.type.trim() || 'general' : 'general';
    const startsAt = this.parseDate(data.startsAt, 'startsAt');
    const endsAt = data.endsAt ? this.parseDate(data.endsAt, 'endsAt') : null;
    this.validateRange(startsAt, endsAt);

    const event = await this.prisma.reminder.create({
      data: { userId, title, type, scheduledAt: startsAt, endsAt },
    });
    return this.toEvent(event);
  }

  async getEvents(userId: string, from?: string, to?: string) {
    const fromDate = from ? this.parseDate(from, 'from') : new Date();
    const toDate = to ? this.parseDate(to, 'to') : new Date(fromDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (toDate <= fromDate) throw new BadRequestException('to must be after from');

    const reminders = await this.prisma.reminder.findMany({
      where: { userId, scheduledAt: { gte: fromDate, lt: toDate } },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    });
    return reminders.map((item) => this.toEvent(item));
  }

  async updateEvent(userId: string, eventId: string, data: CalendarPatch) {
    if (data.title === undefined && data.type === undefined && data.startsAt === undefined && data.endsAt === undefined) {
      throw new BadRequestException('at least one field is required');
    }
    const patch: { title?: string; type?: string; scheduledAt?: Date; endsAt?: Date | null } = {};
    if (data.title !== undefined) {
      const title = typeof data.title === 'string' ? data.title.trim() : '';
      if (!title) throw new BadRequestException('title cannot be empty');
      patch.title = title;
    }
    if (data.type !== undefined) patch.type = typeof data.type === 'string' ? data.type.trim() || 'general' : 'general';

    const existing = await this.findOwnedEvent(userId, eventId);
    const startsAt = data.startsAt !== undefined ? this.parseDate(data.startsAt, 'startsAt') : existing.scheduledAt;
    const endsAt = data.endsAt === null ? null : data.endsAt !== undefined ? this.parseDate(data.endsAt, 'endsAt') : existing.endsAt;
    this.validateRange(startsAt, endsAt);
    if (data.startsAt !== undefined) patch.scheduledAt = startsAt;
    if (data.endsAt !== undefined) patch.endsAt = endsAt;

    const result = await this.prisma.reminder.updateMany({ where: { id: eventId, userId }, data: patch });
    if (result.count === 0) throw new NotFoundException('Calendar event not found');
    const updated = await this.findOwnedEvent(userId, eventId);
    return this.toEvent(updated);
  }

  async updateEventTime(userId: string, eventId: string, time: string) {
    if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) throw new BadRequestException('time must use HH:MM format');
    const [hours, minutes] = time.split(':').map(Number);
    if (hours > 23 || minutes > 59) throw new BadRequestException('time must be a valid time');
    const existing = await this.findOwnedEvent(userId, eventId);
    const scheduledAt = new Date(existing.scheduledAt);
    scheduledAt.setHours(hours, minutes, 0, 0);
    this.validateRange(scheduledAt, existing.endsAt);
    const result = await this.prisma.reminder.updateMany({ where: { id: eventId, userId }, data: { scheduledAt } });
    if (result.count === 0) throw new NotFoundException('Calendar event not found');
    return this.toEvent(await this.findOwnedEvent(userId, eventId));
  }

  async completeEvent(userId: string, eventId: string) {
    const result = await this.prisma.reminder.updateMany({ where: { id: eventId, userId, completed: false }, data: { completed: true } });
    if (result.count === 0) {
      const exists = await this.prisma.reminder.findFirst({ where: { id: eventId, userId }, select: { id: true } });
      if (!exists) throw new NotFoundException('Calendar event not found');
    }
    return { id: eventId, completed: true };
  }

  async reopenEvent(userId: string, eventId: string) {
    const result = await this.prisma.reminder.updateMany({ where: { id: eventId, userId, completed: true }, data: { completed: false } });
    if (result.count === 0) {
      const exists = await this.prisma.reminder.findFirst({ where: { id: eventId, userId }, select: { id: true } });
      if (!exists) throw new NotFoundException('Calendar event not found');
    }
    return { id: eventId, completed: false };
  }

  async deleteEvent(userId: string, eventId: string) {
    const result = await this.prisma.reminder.deleteMany({ where: { id: eventId, userId } });
    if (result.count === 0) throw new NotFoundException('Calendar event not found');
    return { id: eventId, deleted: true };
  }

  private async findOwnedEvent(userId: string, eventId: string) {
    const event = await this.prisma.reminder.findFirst({ where: { id: eventId, userId } });
    if (!event) throw new NotFoundException('Calendar event not found');
    return event;
  }

  private parseDate(value: string, field: string) {
    if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(`${field} must be a valid ISO date`);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new BadRequestException(`${field} must be a valid ISO date`);
    return parsed;
  }

  private validateRange(startsAt: Date, endsAt: Date | null) {
    if (endsAt && endsAt <= startsAt) throw new BadRequestException('endsAt must be after startsAt');
  }

  private toEvent(item: { id: string; title: string; type: string; scheduledAt: Date; endsAt: Date | null; completed: boolean }): CalendarEvent {
    return { id: item.id, title: item.title, type: item.type, startsAt: item.scheduledAt.toISOString(), endsAt: item.endsAt?.toISOString() ?? null, completed: item.completed };
  }
}
