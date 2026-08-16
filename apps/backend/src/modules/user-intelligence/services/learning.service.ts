import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import {
  AdaptiveProfile,
  BehaviorAction,
  BehaviorContext,
} from '../types/behavior.types';

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  async learnFromAction(
    userId: string,
    action: BehaviorAction,
    context: BehaviorContext = {},
  ) {
    const metadata = {
      ...(context.metadata ?? {}),
      hour: context.hour,
      weekday: context.weekday,
      taskId: context.taskId,
      energyLevel: context.energyLevel,
      estimatedMinutes: context.estimatedMinutes,
    };
    await this.prisma.userBehavior.create({
      data: {
        userId,
        action,
        context: context.source ?? context.category ?? null,
        metadata,
      },
    });
    return this.buildProfile(userId);
  }

  async createInsight(
    userId: string,
    title: string,
    description: string,
    confidence = 0.5,
    importance = 1,
  ) {
    return this.prisma.userInsight.create({
      data: {
        userId,
        title,
        description,
        confidence: Math.max(0, Math.min(1, confidence)),
        importance,
      },
    });
  }

  async buildProfile(userId: string): Promise<AdaptiveProfile> {
    const events = await this.prisma.userBehavior.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    const hourStats = new Map<number, { done: number; total: number }>();
    const weekdayStats = new Map<number, { done: number; total: number }>();
    let accepted = 0;
    let rejected = 0;
    let snoozed = 0;
    const minutes: number[] = [];
    for (const event of events) {
      const meta =
        event.metadata &&
        typeof event.metadata === 'object' &&
        !Array.isArray(event.metadata)
          ? (event.metadata as Record<string, unknown>)
          : {};
      const hour =
        typeof meta.hour === 'number' ? meta.hour : event.createdAt.getHours();
      const weekday =
        typeof meta.weekday === 'number'
          ? meta.weekday
          : event.createdAt.getDay();
      const hs = hourStats.get(hour) ?? { done: 0, total: 0 };
      const ws = weekdayStats.get(weekday) ?? { done: 0, total: 0 };
      hs.total += 1;
      ws.total += 1;
      if (
        event.action === 'task_completed' ||
        event.action === 'reminder_completed' ||
        event.action === 'habit_completed'
      ) {
        hs.done += 1;
        ws.done += 1;
      }
      hourStats.set(hour, hs);
      weekdayStats.set(weekday, ws);
      if (event.action === 'suggestion_accepted') accepted += 1;
      if (event.action === 'suggestion_rejected') rejected += 1;
      if (event.action === 'task_snoozed') snoozed += 1;
      if (
        typeof meta.estimatedMinutes === 'number' &&
        meta.estimatedMinutes > 0
      )
        minutes.push(meta.estimatedMinutes);
    }
    const completionByHour: Record<string, number> = {};
    for (const [h, s] of hourStats)
      completionByHour[String(h)] = Number((s.done / s.total).toFixed(2));
    const completionByWeekday: Record<string, number> = {};
    for (const [d, s] of weekdayStats)
      completionByWeekday[String(d)] = Number((s.done / s.total).toFixed(2));
    const bestHours = [...hourStats.entries()]
      .filter(([, s]) => s.total >= 2)
      .sort((a, b) => b[1].done / b[1].total - a[1].done / a[1].total)
      .slice(0, 3)
      .map(([h]) => h);
    const patterns = bestHours.map((hour) => ({
      key: `best_hour_${hour}`,
      label: `Strongest completion window: ${hour}:00`,
      score: completionByHour[String(hour)] ?? 0,
      evidenceCount: hourStats.get(hour)?.total ?? 0,
      confidence: Math.min(0.95, (hourStats.get(hour)?.total ?? 0) / 10),
      recommendation: `Prefer important tasks around ${hour}:00 when possible.`,
    }));
    return {
      bestHours,
      completionByHour,
      completionByWeekday,
      preferredTaskMinutes: minutes.length
        ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length)
        : null,
      acceptanceRate:
        accepted + rejected
          ? Number((accepted / (accepted + rejected)).toFixed(2))
          : 0,
      snoozeRate: events.length
        ? Number((snoozed / events.length).toFixed(2))
        : 0,
      patterns,
    };
  }
}
