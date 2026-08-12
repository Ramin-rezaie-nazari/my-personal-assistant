import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { MemoryIntelligenceController } from './controllers/memory-intelligence.controller';

import { MemoryClassificationService } from './services/memory-classification.service';
import { MemoryConsolidationService } from './services/memory-consolidation.service';
import { MemoryConsolidationIntelligenceService } from './services/memory-consolidation-intelligence.service';
import { MemoryForgettingService } from './services/memory-forgetting.service';
import { MemoryGovernanceService } from './services/memory-governance.service';
import { MemoryIntelligenceService } from './services/memory-intelligence.service';
import { MemoryLifecycleService } from './services/memory-lifecycle.service';
import { MemoryRankingService } from './services/memory-ranking.service';
import { MemoryRelevanceService } from './services/memory-relevance.service';
import { MemoryRetrievalService } from './services/memory-retrieval.service';
import { MemoryScoringService } from './services/memory-scoring.service';
import { MemorySurfaceService } from './services/memory-surface.service';

import { InMemoryMemoryRepository } from './repositories/in-memory-memory.repository';
import { PrismaMemoryRepository } from './repositories/prisma-memory.repository';
import {
  MEMORY_REPOSITORY,
  PERSISTENT_MEMORY_REPOSITORY,
} from './repositories/memory.repository';

@Module({
  imports: [AuthModule],
  controllers: [MemoryIntelligenceController],
  providers: [
    MemoryIntelligenceService,
    MemoryClassificationService,
    MemoryScoringService,
    MemoryConsolidationService,
    MemoryConsolidationIntelligenceService,
    MemoryForgettingService,
    MemoryGovernanceService,
    MemoryLifecycleService,
    MemoryRetrievalService,
    MemoryRankingService,
    MemoryRelevanceService,
    MemorySurfaceService,
    InMemoryMemoryRepository,
    PrismaMemoryRepository,
    {
      provide: MEMORY_REPOSITORY,
      useExisting: PrismaMemoryRepository,
    },
    {
      provide: PERSISTENT_MEMORY_REPOSITORY,
      useExisting: PrismaMemoryRepository,
    },
  ],
  exports: [
    MemoryIntelligenceService,
    MemoryClassificationService,
    MemoryScoringService,
    MemoryConsolidationService,
    MemoryConsolidationIntelligenceService,
    MemoryForgettingService,
    MemoryGovernanceService,
    MemoryLifecycleService,
    MemoryRetrievalService,
    MemoryRankingService,
    MemoryRelevanceService,
    MemorySurfaceService,
    PERSISTENT_MEMORY_REPOSITORY,
  ],
})
export class MemoryIntelligenceModule {}
