import { Injectable } from '@nestjs/common';
import { ScheduleRecoveryService } from './schedule-recovery.service';
import { ScheduleHealthService } from './schedule-health.service';
import { SmartPlanningService } from './smart-planning.service';

export type CoachPriority = 'critical' | 'high' | 'normal' | 'low';
export type CoachAction = { type: 'start_task' | 'recover_schedule' | 'protect_capacity' | 'review_plan'; priority: CoachPriority; title: string; message: string; taskId?: string; reason: string };

@Injectable()
export class ProactiveCoachService {
  constructor(private readonly recovery: ScheduleRecoveryService, private readonly health: ScheduleHealthService, private readonly planner: SmartPlanningService) {}

  async getNextCoach(userId: string, now = new Date()) {
    const [recovery, health, plan] = await Promise.all([this.recovery.analyze(userId, now), this.health.evaluate(userId, now), this.planner.getPlan(userId, now)]);
    const actions: CoachAction[] = [];
    if (recovery.overdue.length) {
      const item = recovery.overdue[0];
      actions.push({ type: 'start_task', priority: 'critical', title: `Focus on ${item.title}`, message: 'This scheduled item has already passed. Starting it now is the fastest way to recover the day.', taskId: item.id, reason: 'overdue scheduled item' });
    }
    if (health.status === 'overloaded' || recovery.actions.some(a => a.type === 'rebuild_schedule')) {
      actions.push({ type: 'recover_schedule', priority: 'high', title: 'Rebuild the rest of today', message: 'Your schedule is overloaded or conflicted. A recovery pass can protect the most important work.', reason: health.status === 'overloaded' ? 'capacity exceeded' : 'schedule conflict' });
    }
    if (health.capacity.remainingMinutes < 30) actions.push({ type: 'protect_capacity', priority: 'high', title: 'Protect your remaining focus', message: 'There is very little usable focus capacity left today. Avoid adding another demanding task.', reason: 'low remaining capacity' });
    if (plan.bestAction) actions.push({ type: 'start_task', priority: 'normal', title: `Next: ${plan.bestAction.title}`, message: `This is currently your highest-value available action. ${plan.bestAction.reasons.join('; ')}.`, taskId: plan.bestAction.id, reason: 'smart planner recommendation' });
    if (!actions.length) actions.push({ type: 'review_plan', priority: 'low', title: 'Your day is clear', message: 'Nothing needs immediate intervention. Keep your current plan and check back when your next scheduled item approaches.', reason: 'no urgent intervention required' });
    const rank: Record<CoachPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };
    actions.sort((a, b) => rank[a.priority] - rank[b.priority]);
    return { generatedAt: now.toISOString(), primary: actions[0], alternatives: actions.slice(1, 4), context: { scheduleStatus: health.status, utilization: health.capacity.utilization, remainingMinutes: health.capacity.remainingMinutes, requiresRecovery: recovery.requiresRecovery } };
  }
}
