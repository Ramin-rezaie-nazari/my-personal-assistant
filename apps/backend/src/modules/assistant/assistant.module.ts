import { Module } from '@nestjs/common';

import { PersonalBrainModule } from '../personal-brain/personal-brain.module';

import { AssistantController } from './controllers/assistant.controller';
import { AssistantService } from './services/assistant.service';
import { MemoryService } from './services/memory.service';
import { ContextService } from './services/context.service';
import { ReasoningService } from './services/reasoning.service';
import { RecommendationService } from './services/recommendation.service';
import { PlanningService } from './services/planning.service';
import { RuleEngineService } from './services/rule-engine.service';
import { KnowledgeService } from './services/knowledge.service';
import { NaturalActionExecutionService } from './services/natural-action-execution.service';
import { ConversationContextService } from './services/conversation-context.service';
import { ContextualCommandService } from './services/contextual-command.service';

@Module({
  imports: [PersonalBrainModule],
  controllers: [AssistantController],
  providers: [
    KnowledgeService,
    RuleEngineService,
    PlanningService,
    AssistantService,
    MemoryService,
    ContextService,
    ReasoningService,
    RecommendationService,
    NaturalActionExecutionService,
    ConversationContextService,
    ContextualCommandService,
  ],
  exports: [
    AssistantService,
    MemoryService,
    ContextService,
    ReasoningService,
    RecommendationService,
    NaturalActionExecutionService,
    ConversationContextService,
    ContextualCommandService,
  ],
})
export class AssistantModule {}
