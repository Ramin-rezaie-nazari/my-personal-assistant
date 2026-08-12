import { Module } from '@nestjs/common';
import { ConversationEngineModule } from '../conversation-engine/conversation-engine.module';
import { DailyModule } from '../daily/daily.module';

import { BrainIntegrationModule } from '../brain-integration/brain-integration.module';
import { ContextEngineModule } from '../context-engine/context-engine.module';
import { MemoryIntelligenceModule } from '../memory-intelligence/memory-intelligence.module';

import { PersonalBrainController } from './controllers/personal-brain.controller';

import { BrainDecisionPipelineService } from './services/brain-decision-pipeline.service';
import { BrainDailyStatusService } from './services/brain-daily-status.service';
import { BrainMemoryContextService } from './services/brain-memory-context.service';
import { BrainOrchestratorService } from './services/brain-orchestrator.service';
import { BrainReasoningContextService } from './services/brain-reasoning-context.service';
import { BrainReasoningEngineService } from './services/brain-reasoning-engine.service';
import { BrainStateService } from './services/brain-state.service';
import { IntentionAnalysisService } from './services/intention-analysis.service';
import { MemoryManagerService } from './services/memory-manager.service';
import { RelevantMemoryContextService } from './services/relevant-memory-context.service';
import { ResponsePlanningService } from './services/response-planning.service';
import { UserContextService } from './services/user-context.service';
import { UserUnderstandingService } from './services/user-understanding.service';

@Module({
  imports: [
    ConversationEngineModule,
    DailyModule,
    BrainIntegrationModule,
    ContextEngineModule,
    MemoryIntelligenceModule,
  ],
  controllers: [PersonalBrainController],
  providers: [
    BrainStateService,
    BrainDecisionPipelineService,
    BrainDailyStatusService,
    BrainMemoryContextService,
    RelevantMemoryContextService,
    BrainReasoningContextService,
    BrainReasoningEngineService,
    BrainOrchestratorService,
    MemoryManagerService,
    UserUnderstandingService,
    UserContextService,
    IntentionAnalysisService,
    ResponsePlanningService,
  ],
  exports: [
    BrainStateService,
    BrainDecisionPipelineService,
    BrainMemoryContextService,
    BrainReasoningContextService,
    BrainReasoningEngineService,
    BrainOrchestratorService,
  ],
})
export class PersonalBrainModule {}
