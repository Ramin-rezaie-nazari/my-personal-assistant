import { Injectable } from '@nestjs/common';

import { BrainStateAnalyzerService } from './brain-state-analyzer.service';

type DecisionReadiness = {
  ready: boolean;
  score: number;
  reasons: string[];
};

@Injectable()
export class DecisionReadinessService {
  constructor(
    private readonly brainStateAnalyzerService: BrainStateAnalyzerService,
  ) {}

  async evaluate(): Promise<DecisionReadiness> {
    const analysis = await this.brainStateAnalyzerService.analyze();

    const reasons: string[] = [];

    if (!analysis.readiness.hasContext) {
      reasons.push('missing-context');
    }

    if (!analysis.readiness.hasMemories) {
      reasons.push('missing-memory');
    }

    if (!analysis.readiness.hasGoals) {
      reasons.push('missing-goals');
    }

    const score = 100 - reasons.length * 25;

    return {
      ready: score >= 75,
      score,
      reasons,
    };
  }
}
