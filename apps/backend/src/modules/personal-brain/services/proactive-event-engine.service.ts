import { Injectable } from '@nestjs/common';
import { ProactiveCoachService } from './proactive-coach.service';
import { ProactiveDecisionQualityService } from './proactive-decision-quality.service';

export type ProactiveEventType = 'task_due_soon' | 'overdue_task' | 'schedule_recovery' | 'capacity_warning' | 'next_action';
export type ProactiveEvent = {
  type: ProactiveEventType;
  priority: 'critical' | 'high' | 'normal';
  title: string;
  body: string;
  scheduledFor: string;
  dedupeKey: string;
  taskId?: string;
  reason: string;
  score: number;
  confidence: number;
};

@Injectable()
export class ProactiveEventEngineService {
  constructor(
    private readonly coach: ProactiveCoachService,
    private readonly quality: ProactiveDecisionQualityService,
  ) {}

  async buildEvents(userId: string, now = new Date()): Promise<ProactiveEvent[]> {
    const coach = await this.coach.getNextCoach(userId, now);
    const events: ProactiveEvent[] = [];
    const primary = coach.primary;
    const quality = this.quality.evaluate({
      relevance: primary.priority === 'low' ? 0.45 : 0.85,
      urgency: primary.priority === 'critical' ? 1 : primary.priority === 'high' ? 0.8 : 0.55,
      userBenefit: primary.type === 'review_plan' ? 0.4 : 0.85,
      interruptionCost: primary.priority === 'critical' ? 0.05 : 0.25,
    });

    if (!quality.shouldNotify && primary.priority !== 'critical') return events;

    if (primary.type === 'start_task' && primary.taskId) {
      const critical = primary.priority === 'critical';
      const delay = critical ? 0 : 10;
      events.push({
        type: critical ? 'overdue_task' : 'next_action',
        priority: critical ? 'critical' : 'normal',
        title: primary.title,
        body: primary.message,
        scheduledFor: new Date(now.getTime() + delay * 60000).toISOString(),
        dedupeKey: `${primary.type}:${primary.taskId}:${now.toISOString().slice(0, 10)}`,
        taskId: primary.taskId,
        reason: primary.reason,
        score: quality.score,
        confidence: quality.confidence,
      });
    } else if (primary.type === 'recover_schedule') {
      events.push({
        type: 'schedule_recovery',
        priority: 'high',
        title: primary.title,
        body: primary.message,
        scheduledFor: now.toISOString(),
        dedupeKey: `recovery:${now.toISOString().slice(0, 10)}`,
        reason: primary.reason,
        score: quality.score,
        confidence: quality.confidence,
      });
    } else if (primary.type === 'protect_capacity') {
      events.push({
        type: 'capacity_warning',
        priority: 'high',
        title: primary.title,
        body: primary.message,
        scheduledFor: now.toISOString(),
        dedupeKey: `capacity:${now.toISOString().slice(0, 10)}`,
        reason: primary.reason,
        score: quality.score,
        confidence: quality.confidence,
      });
    }
    return events;
  }
}
