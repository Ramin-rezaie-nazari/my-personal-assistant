import { Module } from '@nestjs/common';

import { BrainIntegrationModule } from '../brain-integration/brain-integration.module';
import { ContextEngineModule } from '../context-engine/context-engine.module';
import { MemoryIntelligenceModule } from '../memory-intelligence/memory-intelligence.module';

import { PersonalBrainController } from './controllers/personal-brain.controller';

import { BrainOrchestratorService } from './services/brain-orchestrator.service';
import { BrainStateService } from './services/brain-state.service';
import { BrainDecisionPipelineService } from './services/brain-decision-pipeline.service';
import { BrainMemoryContextService } from './services/brain-memory-context.service';
import { RelevantMemoryContextService } from './services/relevant-memory-context.service';

import { MemoryManagerService } from './services/memory-manager.service';
import { UserUnderstandingService } from './services/user-understanding.service';
import { IntentionAnalysisService } from './services/intention-analysis.service';
import { ResponsePlanningService } from './services/response-planning.service';

@Module({
  imports: [
    BrainIntegrationModule,
    ContextEngineModule,
    MemoryIntelligenceModule,
  ],
  controllers: [PersonalBrainController],
  providers: [
    BrainStateService,
    BrainDecisionPipelineService,
    BrainMemoryContextService,
    RelevantMemoryContextService,
    BrainOrchestratorService,
    MemoryManagerService,
    UserUnderstandingService,
    IntentionAnalysisService,
    ResponsePlanningService,
  ],
  exports: [
    BrainStateService,
    BrainDecisionPipelineService,
    BrainMemoryContextService,
    BrainDecisionPipelineService,
    BrainOrchestratorService,
  ],
})
export class PersonalBrainModule {}
