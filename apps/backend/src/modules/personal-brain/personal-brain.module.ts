import { Module } from '@nestjs/common';

import { BrainIntegrationModule } from '../brain-integration/brain-integration.module';
import { ContextEngineModule } from '../context-engine/context-engine.module';
import { PersonalBrainController } from './controllers/personal-brain.controller';

import { BrainOrchestratorService } from './services/brain-orchestrator.service';
import { BrainStateService } from './services/brain-state.service';
import { MemoryManagerService } from './services/memory-manager.service';
import { UserUnderstandingService } from './services/user-understanding.service';
import { IntentionAnalysisService } from './services/intention-analysis.service';
import { ResponsePlanningService } from './services/response-planning.service';

@Module({
  imports: [BrainIntegrationModule],
  imports: [ContextEngineModule],
  controllers: [PersonalBrainController],
  providers: [
    BrainStateService,
    BrainOrchestratorService,
    MemoryManagerService,
    UserUnderstandingService,
    IntentionAnalysisService,
    ResponsePlanningService,
  ],
  exports: [BrainStateService, BrainOrchestratorService],
})
export class PersonalBrainModule {}
