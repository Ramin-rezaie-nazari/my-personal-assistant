import { Injectable } from '@nestjs/common';
import { BrainLifeContextService } from '../../personal-brain/services/brain-life-context.service';
import { DecisionScoringService, ActionCandidate } from './decision-scoring.service';
import { RuleEvaluationService } from './rule-evaluation.service';

@Injectable()
export class ActionDecisionService {
  constructor(
    private readonly lifeContext: BrainLifeContextService,
    private readonly rules: RuleEvaluationService,
    private readonly scoring: DecisionScoringService,
  ) {}

  async generate(userId: string, dateKey?: string) {
    const context = await this.lifeContext.getToday(userId, dateKey);
    const candidates: ActionCandidate[] = this.rules.evaluate(context);
    const ranked = this.scoring.rank(candidates);
    return {
      generatedAt: new Date().toISOString(),
      strategy: 'deterministic-life-context-v1',
      recommended: ranked[0] ?? null,
      alternatives: ranked.slice(1, 4),
      context: {
        goalsActive: context.goals.active,
        goalsDueSoon: context.goals.dueSoon,
        habitCompletionPercent: context.habits.completionPercent,
        remindersPending: context.reminders.pending,
        supplementsRemaining: context.supplements.remaining,
      },
    };
  }
}
