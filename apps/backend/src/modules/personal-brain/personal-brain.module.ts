import { Module } from '@nestjs/common';
import { PersonalBrainController } from './controllers/personal-brain.controller';

import { BrainOrchestratorService } from './services/brain-orchestrator.service';
import { MemoryManagerService } from './services/memory-manager.service';
import { UserUnderstandingService } from './services/user-understanding.service';
import { IntentionAnalysisService } from './services/intention-analysis.service';
import { ResponsePlanningService } from './services/response-planning.service';

@Module({
  controllers: [PersonalBrainController],
  providers: [
    BrainOrchestratorService,
    MemoryManagerService,
    UserUnderstandingService,
    IntentionAnalysisService,
    ResponsePlanningService,
  ],
  exports: [BrainOrchestratorService],
})
export class PersonalBrainModule {}
