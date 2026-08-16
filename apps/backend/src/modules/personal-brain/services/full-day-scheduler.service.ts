import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { LearningService } from '../../user-intelligence/services/learning.service';
import { SchedulePolicyService } from './schedule-policy.service';

export type ScheduleItem = { type: 'task' | 'reminder' | 'supplement' | 'habit'; id: string; title: string; start: string; end: string; priority: number; reason: string };
type Block = { start: Date; end: Date; source: string; id: string };
type TaskRow = { id: string; title: string; priority: number; estimatedMinutes: number | null; dueAt: Date | null; scheduledAt: Date | null; goalTitle: string | null; dependencyStatus: string[] };

@Injectable()
export class FullDaySchedulerService {
  constructor(private readonly prisma: PrismaService, private readonly learning: LearningService, private readonly policy: SchedulePolicyService) {}

  async buildDay(userId: string, date = new Date()) {
    const day = new Date(date); day.setHours(0, 0, 0, 0); const next = new Date(day); next.setDate(next.getDate() + 1);
    const [tasks, reminders, supplements, habits, adaptive] = await Promise.all([
      this.prisma.$queryRaw<TaskRow[]>`
        SELECT t."id", t."title", t."priority", t."estimatedMinutes", t."dueAt", t."scheduledAt", g."title" AS "goalTitle",
               COALESCE(array_agg(dep."status") FILTER (WHERE dep."id" IS NOT NULL), ARRAY[]::text[]) AS "dependencyStatus"
        FROM "LifeTask" t
        LEFT JOIN "Goal" g ON g."id" = t."goalId"
        LEFT JOIN "TaskDependency" d ON d."taskId" = t."id"
        LEFT JOIN "LifeTask" dep ON dep."id" = d."dependsOnTaskId"
        WHERE t."userId"=${userId} AND t."status" IN ('pending','in_progress')
          AND (t."dueAt" <= ${next} OR (t."scheduledAt" >= ${day} AND t."scheduledAt" < ${next}) OR t."scheduledAt" IS NULL)
        GROUP BY t."id", g."title"
        ORDER BY t."priority" ASC, t."dueAt" ASC NULLS LAST`,
      this.prisma.reminder.findMany({ where: { userId, completed: false, scheduledAt: { gte: day, lt: next } }, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.supplement.findMany({ where: { userId, active: true }, orderBy: { scheduledTime: 'asc' } }),
      this.prisma.habit.findMany({ where: { userId, active: true }, orderBy: { createdAt: 'asc' } }),
      this.learning.buildProfile(userId),
    ]);
    const policy = this.policy.getPolicy(adaptive); const items: ScheduleItem[] = []; const blocks: Block[] = [];
    const addFixed = (item: ScheduleItem) => { items.push(item); blocks.push({ start: new Date(item.start), end: new Date(item.end), source: item.type, id: item.id }); };
    for (const r of reminders) addFixed({ type: 'reminder', id: r.id, title: r.title, start: r.scheduledAt.toISOString(), end: new Date(r.scheduledAt.getTime() + 10 * 60000).toISOString(), priority: 1, reason: 'existing reminder' });
    for (const s of supplements) { const [h, m] = s.scheduledTime.split(':').map(Number); if (Number.isFinite(h) && Number.isFinite(m)) { const start = new Date(day); start.setHours(h, m, 0, 0); addFixed({ type: 'supplement', id: s.id, title: s.name, start: start.toISOString(), end: new Date(start.getTime() + 5 * 60000).toISOString(), priority: 2, reason: 'scheduled supplement' }); } }
    for (const h of habits) { const start = new Date(day); start.setHours(20, 0, 0, 0); addFixed({ type: 'habit', id: h.id, title: h.name, start: start.toISOString(), end: new Date(start.getTime() + 10 * 60000).toISOString(), priority: 3, reason: 'daily habit' }); }
    const preferred = adaptive.bestHours[0]; let cursor = new Date(day); if (preferred !== undefined && preferred >= policy.workingWindow.startHour && preferred < policy.workingWindow.endHour) cursor.setHours(preferred, 0, 0, 0); else cursor.setHours(policy.focusWindow.startHour, 0, 0, 0);
    const conflicts = (start: Date, end: Date) => blocks.some(x => start < x.end && end > x.start);
    const findSlot = (minutes: number) => { let candidate = new Date(cursor); for (let i = 0; i < 96; i++) { const end = new Date(candidate.getTime() + minutes * 60000); if (candidate.getHours() >= policy.workingWindow.endHour || end.getHours() > policy.workingWindow.endHour) return null; if (!conflicts(candidate, end)) return { start: candidate, end }; candidate = new Date(candidate.getTime() + 15 * 60000); } return null; };
    const ordered = tasks.map(t => ({ t, blocked: t.dependencyStatus.some(status => status !== 'completed') })).sort((a, b) => { if (a.blocked !== b.blocked) return a.blocked ? 1 : -1; const ad = a.t.dueAt && a.t.dueAt <= next ? -2 : 0; const bd = b.t.dueAt && b.t.dueAt <= next ? -2 : 0; return (a.t.priority + ad) - (b.t.priority + bd); });
    const unscheduled: Array<{ id: string; title: string; reason: string }> = [];
    for (const { t, blocked } of ordered) { if (blocked) { unscheduled.push({ id: t.id, title: t.title, reason: 'blocked by incomplete dependency' }); continue; } const duration = Math.max(10, Math.min(180, t.estimatedMinutes ?? adaptive.preferredTaskMinutes ?? 30)); const slot = findSlot(duration); if (!slot) { unscheduled.push({ id: t.id, title: t.title, reason: 'no compatible free slot today' }); continue; } items.push({ type: 'task', id: t.id, title: t.title, start: slot.start.toISOString(), end: slot.end.toISOString(), priority: t.priority, reason: t.goalTitle ? 'supports an active goal' : 'priority and deadline' }); blocks.push({ start: slot.start, end: slot.end, source: 'task', id: t.id }); cursor = new Date(slot.end.getTime() + policy.bufferMinutes * 60000); }
    items.sort((a, b) => a.start.localeCompare(b.start));
    const overlapCount = items.reduce((count, item, index) => count + items.slice(index + 1).filter(other => new Date(item.start) < new Date(other.end) && new Date(other.start) < new Date(item.end)).length, 0);
    return { date: day.toISOString().slice(0, 10), items, unscheduled, adaptive: { bestHours: adaptive.bestHours, preferredTaskMinutes: adaptive.preferredTaskMinutes, snoozeRate: adaptive.snoozeRate }, policy, validation: { overlapCount, isConflictFree: overlapCount === 0 }, summary: { totalItems: items.length, tasks: items.filter(i => i.type === 'task').length, reminders: items.filter(i => i.type === 'reminder').length, habits: items.filter(i => i.type === 'habit').length, supplements: items.filter(i => i.type === 'supplement').length, unscheduled: unscheduled.length } };
  }
}
