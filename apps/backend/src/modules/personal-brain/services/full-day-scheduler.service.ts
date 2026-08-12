import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { LearningService } from '../../user-intelligence/services/learning.service';

export type ScheduleItem = { type: 'task' | 'reminder' | 'supplement' | 'habit'; id: string; title: string; start: string; end: string; priority: number; reason: string };

@Injectable()
export class FullDaySchedulerService {
  constructor(private readonly prisma: PrismaService, private readonly learning: LearningService) {}

  async buildDay(userId: string, date = new Date()) {
    const day = new Date(date); day.setHours(0, 0, 0, 0); const next = new Date(day); next.setDate(next.getDate() + 1);
    const [tasks, reminders, supplements, habits, adaptive] = await Promise.all([
      this.prisma.lifeTask.findMany({ where: { userId, status: { in: ['pending', 'in_progress'] }, OR: [{ dueAt: { lte: next } }, { scheduledAt: { gte: day, lt: next } }, { scheduledAt: null }] }, include: { dependencies: { include: { dependsOnTask: true } }, goal: true }, orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }] }),
      this.prisma.reminder.findMany({ where: { userId, completed: false, scheduledAt: { gte: day, lt: next } }, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.supplement.findMany({ where: { userId, active: true }, orderBy: { scheduledTime: 'asc' } }),
      this.prisma.habit.findMany({ where: { userId, active: true }, orderBy: { createdAt: 'asc' } }),
      this.learning.buildProfile(userId),
    ]);
    const items: ScheduleItem[] = [];
    for (const r of reminders) items.push({ type: 'reminder', id: r.id, title: r.title, start: r.scheduledAt.toISOString(), end: new Date(r.scheduledAt.getTime() + 10 * 60000).toISOString(), priority: 1, reason: 'existing reminder' });
    let cursor = new Date(day); const preferred = adaptive.bestHours[0]; if (preferred !== undefined && preferred >= 6) cursor.setHours(preferred, 0, 0, 0);
    const ordered = tasks.map(t => ({ t, blocked: t.dependencies.some(d => d.dependsOnTask.status !== 'completed') })).filter(x => !x.blocked).sort((a, b) => {
      const ap = a.t.priority + (a.t.dueAt && a.t.dueAt <= next ? -2 : 0); const bp = b.t.priority + (b.t.dueAt && b.t.dueAt <= next ? -2 : 0); return ap - bp;
    });
    for (const { t } of ordered) { const duration = Math.max(10, Math.min(180, t.estimatedMinutes)); if (cursor.getHours() >= 22) break; const start = new Date(cursor); const end = new Date(cursor.getTime() + duration * 60000); items.push({ type: 'task', id: t.id, title: t.title, start: start.toISOString(), end: end.toISOString(), priority: t.priority, reason: t.goal ? 'supports an active goal' : 'priority and deadline' }); cursor = new Date(end.getTime() + 15 * 60000); }
    for (const s of supplements) { const [h, m] = s.scheduledTime.split(':').map(Number); if (Number.isFinite(h) && Number.isFinite(m)) { const start = new Date(day); start.setHours(h, m, 0, 0); items.push({ type: 'supplement', id: s.id, title: s.name, start: start.toISOString(), end: new Date(start.getTime() + 5 * 60000).toISOString(), priority: 2, reason: 'scheduled supplement' }); } }
    for (const h of habits) { const start = new Date(day); start.setHours(20, 0, 0, 0); items.push({ type: 'habit', id: h.id, title: h.name, start: start.toISOString(), end: new Date(start.getTime() + 10 * 60000).toISOString(), priority: 3, reason: 'daily habit' }); }
    items.sort((a, b) => a.start.localeCompare(b.start));
    return { date: day.toISOString().slice(0, 10), items, adaptive: { bestHours: adaptive.bestHours, preferredTaskMinutes: adaptive.preferredTaskMinutes }, summary: { totalItems: items.length, tasks: items.filter(i => i.type === 'task').length, reminders: items.filter(i => i.type === 'reminder').length, habits: items.filter(i => i.type === 'habit').length, supplements: items.filter(i => i.type === 'supplement').length } };
  }
}
