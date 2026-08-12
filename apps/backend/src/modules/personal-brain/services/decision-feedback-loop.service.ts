import { Injectable } from '@nestjs/common';
import { DecisionCandidate } from './unified-decision-engine.service';
import { PersonalizationEngineService } from './personalization-engine.service';

export type DecisionFeedback = { userId?: string; candidate: DecisionCandidate; outcome: 'accepted' | 'completed' | 'dismissed' | 'failed' | 'skipped'; reward?: number };

@Injectable()
export class DecisionFeedbackLoopService {
  constructor(private readonly personalization: PersonalizationEngineService) {}

  record(feedback: DecisionFeedback) {
    const reward = feedback.reward ?? this.defaultReward(feedback.outcome);
    const userId = feedback.userId ?? 'system';
    const signal = this.personalization.upsertSignal(userId, feedback.candidate.domain, {
      key: `decision.${feedback.candidate.action}`,
      value: feedback.outcome,
      score: reward,
      confidence: 0.6,
      source: 'decision-feedback',
    });
    return { ...feedback, reward, signal };
  }

  private defaultReward(outcome: DecisionFeedback['outcome']) {
    return { accepted: 0.65, completed: 1, dismissed: -0.45, failed: -0.7, skipped: -0.2 }[outcome];
  }
}
