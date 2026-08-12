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

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(userId: string, data: { title: string; type: string; startsAt: string; endsAt?: string }) {
    const title = data.title.trim();
    if (!title) throw new BadRequestException('title is required');
    const startsAt = new Date(data.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new BadRequestException('startsAt must be a valid ISO date');
    const endsAt = data.endsAt ? new Date(data.endsAt) : null;
    if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    const reminder = await this.prisma.reminder.create({
      data: { userId, title, type: data.type.trim() || 'general', scheduledAt: startsAt },
    });
    return this.toEvent(reminder, endsAt);
  }

  async getEvents(userId: string, from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date(fromDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate <= fromDate) {
      throw new BadRequestException('from/to must be valid dates and to must be after from');
    }
    const reminders = await this.prisma.reminder.findMany({
      where: { userId, scheduledAt: { gte: fromDate, lt: toDate } },
      orderBy: { scheduledAt: 'asc' },
    });
    return reminders.map((item) => this.toEvent(item));
  }

  async updateEvent(userId: string, eventId: string, data: { title?: string; type?: string; startsAt?: string }) {
    const patch: { title?: string; type?: string; scheduledAt?: Date } = {};
    if (data.title !== undefined) {
      const title = data.title.trim();
      if (!title) throw new BadRequestException('title cannot be empty');
      patch.title = title;
    }
    if (data.type !== undefined) patch.type = data.type.trim() || 'general';
    if (data.startsAt !== undefined) {
      const startsAt = new Date(data.startsAt);
      if (Number.isNaN(startsAt.getTime())) throw new BadRequestException('startsAt must be a valid ISO date');
      patch.scheduledAt = startsAt;
    }
    const result = await this.prisma.reminder.updateMany({ where: { id: eventId, userId }, data: patch });
    if (result.count === 0) throw new NotFoundException('Calendar event not found');
    const updated = await this.prisma.reminder.findFirst({ where: { id: eventId, userId } });
    if (!updated) throw new NotFoundException('Calendar event not found');
    return this.toEvent(updated);
  }

  async completeEvent(userId: string, eventId: string) {
    const result = await this.prisma.reminder.updateMany({ where: { id: eventId, userId }, data: { completed: true } });
    if (result.count === 0) throw new NotFoundException('Calendar event not found');
    return { completed: true };
  }

  private toEvent(item: { id: string; title: string; type: string; scheduledAt: Date; completed: boolean }, endsAt: Date | null = null): CalendarEvent {
    return { id: item.id, title: item.title, type: item.type, startsAt: item.scheduledAt.toISOString(), endsAt: endsAt?.toISOString() ?? null, completed: item.completed };
  }
}
