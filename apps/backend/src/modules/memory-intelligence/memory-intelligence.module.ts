import { Module } from '@nestjs/common';

import { MemoryIntelligenceController } from './controllers/memory-intelligence.controller';

import { MemoryClassificationService } from './services/memory-classification.service';
import { MemoryScoringService } from './services/memory-scoring.service';
import { MemoryConsolidationService } from './services/memory-consolidation.service';

@Module({
  controllers: [MemoryIntelligenceController],
  providers: [
    MemoryClassificationService,
    MemoryScoringService,
    MemoryConsolidationService,
  ],
  exports: [
    MemoryClassificationService,
    MemoryScoringService,
    MemoryConsolidationService,
  ],
})
export class MemoryIntelligenceModule {}
