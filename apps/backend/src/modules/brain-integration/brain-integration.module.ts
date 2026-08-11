import { Module } from '@nestjs/common';

import { MemoryIntelligenceModule } from '../memory-intelligence/memory-intelligence.module';

import { BrainIntegrationController } from './controllers/brain-integration.controller';

import { BrainContextService } from './services/brain-context.service';
import { BrainMemoryService } from './services/brain-memory.service';
import { BrainGoalService } from './services/brain-goal.service';

@Module({
  imports: [MemoryIntelligenceModule],
  controllers: [BrainIntegrationController],
  providers: [BrainContextService, BrainMemoryService, BrainGoalService],
  exports: [BrainContextService, BrainMemoryService, BrainGoalService],
})
export class BrainIntegrationModule {}
