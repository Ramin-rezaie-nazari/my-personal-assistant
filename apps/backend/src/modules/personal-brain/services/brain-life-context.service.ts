import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { LearningService } from '../../user-intelligence/services/learning.service';
import { FitnessProfileService } from '../../fitness/services/fitness-profile.service';
import { WorkoutPerformanceMemoryService } from './workout-performance-memory.service';
import { DecisionExplanationMemoryService } from './decision-explanation-memory.service';
import { DecisionOutcomeLearningService } from './decision-outcome-learning.service';
import type { BrainLifeContext, BrainFitnessPerformanceMemory } from '../types';

type GoalRow = { id: string; title: string; category: string; priority: number; progressPercent: number; targetDate: Date | null };
const EMPTY_PERFORMANCE_MEMORY: BrainFitnessPerformanceMemory = { windowDays: 28, sessions: 0, averageForm: null, averageCompletion: null, averageDifficulty: null, averageRecovery: null, formTrend: null, completionTrend: null, recoveryTrend: null, disciplineSummary: {}, exerciseTrends: [] };

@Injectable()
export class BrainLifeContextService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly learning?: LearningService,
    @Optional() private readonly fitness?: FitnessProfileService,
    @Optional() private readonly performanceMemory?: WorkoutPerformanceMemoryService,
    @Optional() private readonly decisionMemory?: DecisionExplanationMemoryService,
    @Optional() private readonly outcomeMemory?: DecisionOutcomeLearningService,
  ) {}

  async getToday(userId: string, dateKey = new Date().toISOString().slice(0, 10)): Promise<BrainLifeContext & { adaptive: Awaited<ReturnType<LearningService['buildProfile']>> | { bestHours: number[]; preferredTaskMinutes: number; snoozeRate: number; acceptanceRate: number } }> {
    const end = new Date(`${dateKey}T23:59:59.999Z`); const start = new Date(end); start.setUTCDate(start.getUTCDate() - 6);
    const goalsPromise = typeof (this.prisma as unknown as { $queryRaw?: unknown }).$queryRaw === 'function'
      ? this.prisma.$queryRaw<GoalRow[]>`SELECT "id","title","category","priority","progressPercent","targetDate" FROM "Goal" WHERE "userId"=${userId} AND "status"='active' ORDER BY "priority" ASC, "targetDate" ASC NULLS LAST, "createdAt" ASC LIMIT 10`
      : Promise.resolve([] as GoalRow[]);
    const [habits, pendingReminders, nextReminder, supplements, goals, adaptive, fitnessContext, performanceMemory, decisionMemory, outcomeMemory] = await Promise.all([
      this.prisma.habit.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey: { gte: this.key(start), lte: dateKey } } } }, orderBy: { createdAt: 'asc' } }),
      this.prisma.reminder.count({ where: { userId, completed: false } }),
      this.prisma.reminder.findFirst({ where: { userId, completed: false, scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.supplement.findMany({ where: { userId, active: true }, include: { logs: { where: { dateKey }, take: 1 } }, orderBy: [{ scheduledTime: 'asc' }, { name: 'asc' }] }),
      goalsPromise,
      this.learning?.buildProfile(userId) ?? Promise.resolve({ bestHours: [], preferredTaskMinutes: 30, snoozeRate: 0, acceptanceRate: 0 }),
      this.fitness?.buildRecommendationContext(userId) ?? Promise.resolve({ disciplines: [], primaryGoal: null, equipment: ['none'], constraints: [], targetAreas: [] }),
      this.performanceMemory?.get(userId, 28) ?? Promise.resolve(EMPTY_PERFORMANCE_MEMORY),
      this.decisionMemory?.trend(userId, 90) ?? Promise.resolve({ windowDays: 90, decisions: 0, changeSignal: 'insufficient-data' as const, repeatedReasons: [], selectedFrequency: [] }),
      this.outcomeMemory?.profile(userId) ?? Promise.resolve({ sampleSize: 0, averageScore: null, positiveRate: 0, negativeRate: 0, trend: 'insufficient-data' as const, confidenceAdjustment: 0 }),
    ]);
    const completedThisWeek = habits.reduce((sum, h) => sum + h.logs.length, 0); const possible = habits.reduce((sum, h) => sum + Math.min(h.targetPerWeek, 7), 0);
    const habitItems = habits.map(h => { const dates = new Set(h.logs.map(l => l.dateKey)); let streak = 0; for (let i = 0; i < 14; i++) { const d = new Date(`${dateKey}T00:00:00.000Z`); d.setUTCDate(d.getUTCDate() - i); if (!dates.has(this.key(d))) break; streak++; } return { id: h.id, name: h.name, targetPerWeek: h.targetPerWeek, completedThisWeek: h.logs.length, streak }; });
    const taken = supplements.filter(s => s.logs.length > 0).length;
    const goalItems = goals.map(g => ({ id: g.id, title: g.title, category: g.category, priority: g.priority, progressPercent: g.progressPercent, targetDate: g.targetDate?.toISOString() ?? null, daysRemaining: g.targetDate ? Math.ceil((g.targetDate.getTime() - end.getTime()) / 86400000) : null }));
    const dueSoon = goalItems.filter(g => g.daysRemaining !== null && g.daysRemaining >= 0 && g.daysRemaining <= 7).length;
    const averageProgress = goalItems.length ? Math.round(goalItems.reduce((s, g) => s + g.progressPercent, 0) / goalItems.length) : 0;
    return {
      habits: { active: habits.length, completedThisWeek, completionPercent: possible ? Math.min(100, Math.round(completedThisWeek / possible * 100)) : 0, currentStreak: habitItems.length ? Math.max(...habitItems.map(i => i.streak)) : 0, items: habitItems },
      reminders: { pending: pendingReminders, next: nextReminder ? { id: nextReminder.id, title: nextReminder.title, type: nextReminder.type, scheduledAt: nextReminder.scheduledAt.toISOString() } : null },
      supplements: { total: supplements.length, taken, remaining: Math.max(0, supplements.length - taken), completionPercent: supplements.length ? Math.round(taken / supplements.length * 100) : 0, next: (() => { const item = supplements.find(s => s.logs.length === 0); return item ? { id: item.id, name: item.name, dosage: item.dosage, scheduledTime: item.scheduledTime } : null; })() },
      goals: { active: goalItems.length, dueSoon, averageProgress, next: goalItems[0] ?? null, items: goalItems },
      fitness: { disciplines: fitnessContext.disciplines, primaryGoal: fitnessContext.primaryGoal ? { id: fitnessContext.primaryGoal.id, kind: fitnessContext.primaryGoal.kind, title: fitnessContext.primaryGoal.title, targetAreas: fitnessContext.primaryGoal.targetAreas, desiredOutcome: fitnessContext.primaryGoal.desiredOutcome, priority: fitnessContext.primaryGoal.priority, avoidBulk: fitnessContext.primaryGoal.avoidBulk, active: fitnessContext.primaryGoal.active } : null, equipment: fitnessContext.equipment, constraints: fitnessContext.constraints.map(c => typeof c === 'string' ? c : c), targetAreas: fitnessContext.targetAreas, performanceMemory },
      decisionMemory,
      outcomeMemory,
      adaptive,
    } as BrainLifeContext & { adaptive: typeof adaptive };
  }

  private key(date: Date) { return date.toISOString().slice(0, 10); }
}
