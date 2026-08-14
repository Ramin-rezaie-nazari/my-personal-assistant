import { Injectable } from '@nestjs/common';
import { SmartPlanningService } from './smart-planning.service';
import { ScheduleInsightsService } from './schedule-insights.service';

@Injectable()
export class NextBestActionService {
  constructor(private readonly planner: SmartPlanningService, private readonly insights: ScheduleInsightsService) {}

  async get(userId: string, date = new Date()) {
    const [plan, insights] = await Promise.all([this.planner.getPlan(userId, date), this.insights.getInsights(userId, date)]);
    const action = plan.bestAction;
    if (!action) return { action: null, mode: 'maintenance', message: 'No actionable task is currently available.', alternatives: plan.alternatives, signals: insights.recommendations };
    const urgent = action.reasons.includes('overdue') || action.reasons.includes('due today');
    return {
      action: {
        id: action.id,
        title: action.title,
        estimatedMinutes: action.estimatedMinutes,
        priority: action.priority,
        urgent,
        reasons: action.reasons,
      },
      execution: {
        candidate: {
          id: action.id,
          domain: 'schedule' as const,
          action: 'complete_life_task',
          score: action.score,
          confidence: 1,
          priority: action.priority,
          source: 'smart_planning',
          durationMinutes: action.estimatedMinutes,
        },
      },
      mode: urgent ? 'urgent' : 'normal',
      alternatives: plan.alternatives,
      signals: insights.recommendations,
    };
  }
}
