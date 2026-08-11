import { Module } from '@nestjs/common';

import { MemoryIntelligenceController } from './controllers/memory-intelligence.controller';

import { MemoryClassificationService } from './services/memory-classification.service';
import { MemoryConsolidationService } from './services/memory-consolidation.service';
import { MemoryIntelligenceService } from './services/memory-intelligence.service';
import { MemoryLifecycleService } from './services/memory-lifecycle.service';
import { MemoryScoringService } from './services/memory-scoring.service';

import { InMemoryMemoryRepository } from './repositories/in-memory-memory.repository';
import { MEMORY_REPOSITORY } from './repositories/memory.repository';

@Module({
  controllers: [MemoryIntelligenceController],
  providers: [
    MemoryIntelligenceService,
    MemoryClassificationService,
    MemoryScoringService,
    MemoryConsolidationService,
    MemoryLifecycleService,
    {
      provide: MEMORY_REPOSITORY,
      useClass: InMemoryMemoryRepository,
    },
  ],
  exports: [
    MemoryIntelligenceService,
    MemoryClassificationService,
    MemoryScoringService,
    MemoryConsolidationService,
    MemoryLifecycleService,
  ],
})
export class MemoryIntelligenceModule {}
