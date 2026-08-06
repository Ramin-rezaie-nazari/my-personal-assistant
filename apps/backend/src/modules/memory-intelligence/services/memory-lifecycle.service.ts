import { Injectable } from '@nestjs/common';

import { MemoryClassificationService } from './memory-classification.service';
import { MemoryScoringService } from './memory-scoring.service';
import { MemoryConsolidationService } from './memory-consolidation.service';

type MemoryLifecycleResult = {
  input: Record<string, unknown>;
  classification: Record<string, unknown>;
  score: Record<string, unknown>;
  consolidated: Record<string, unknown>;
};

@Injectable()
export class MemoryLifecycleService {
  constructor(
    private readonly classificationService: MemoryClassificationService,
    private readonly scoringService: MemoryScoringService,
    private readonly consolidationService: MemoryConsolidationService,
  ) {}

  processMemory(input: Record<string, unknown>): MemoryLifecycleResult {
    const classification = this.classificationService.classify(input);

    const score = this.scoringService.score(input);

    const consolidated = this.consolidationService.consolidate({
      input,
      classification,
      score,
    });

    return {
      input,
      classification,
      score,
      consolidated,
    };
  }
}
