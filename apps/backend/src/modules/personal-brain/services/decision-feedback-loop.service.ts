import { Injectable } from '@nestjs/common';
import { DecisionCandidate } from './unified-decision-engine.service';
import { PersonalizationEngineService } from './personalization-engine.service';
import { DecisionOutcomeLearningService } from './decision-outcome-learning.service';

export type DecisionFeedback = { userId?: string; candidate: DecisionCandidate; outcome: 'accepted' | 'completed' | 'dismissed' | 'failed' | 'skipped'; reward?: number; note?: string };

@Injectable()
export class DecisionFeedbackLoopService {
  constructor(
    private readonly personalization: PersonalizationEngineService,
    private readonly outcomeLearning: DecisionOutcomeLearningService,
  ) {}

  async record(feedback: DecisionFeedback) {
    const reward = feedback.reward ?? this.defaultReward(feedback.outcome);
    const userId = feedback.userId ?? 'system';
    const signal = this.personalization.upsertSignal(userId, feedback.candidate.domain, {
      key: `decision.${feedback.candidate.action}`,
      value: feedback.outcome,
      score: reward,
      confidence: 0.6,
      source: 'decision-feedback',
    });

    const learning = await this.outcomeLearning.record({
      userId,
      decisionId: feedback.candidate.id,
      outcome: this.toLearningOutcome(feedback.outcome),
      score: reward,
      note: feedback.note,
      source: userId === 'system' ? 'system' : 'behavior',
    });

    return { ...feedback, reward, signal, learning };
  }

  private toLearningOutcome(outcome: DecisionFeedback['outcome']): 'positive' | 'neutral' | 'negative' {
    if (outcome === 'accepted' || outcome === 'completed') return 'positive';
    if (outcome === 'dismissed' || outcome === 'failed') return 'negative';
    return 'neutral';
  }

  private defaultReward(outcome: DecisionFeedback['outcome']) {
    return { accepted: 0.65, completed: 1, dismissed: -0.45, failed: -0.7, skipped: -0.2 }[outcome];
  }
}
