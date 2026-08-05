import { Module } from '@nestjs/common';
import { AssistantController } from './controllers/assistant.controller';
import { AssistantService } from './services/assistant.service';
import { MemoryService } from './services/memory.service';
import { ContextService } from './services/context.service';
import { ReasoningService } from './services/reasoning.service';
import { RecommendationService } from './services/recommendation.service';

@Module({
  controllers: [AssistantController],
  providers: [
    AssistantService,
    MemoryService,
    ContextService,
    ReasoningService,
    RecommendationService,
  ],
  exports: [
    AssistantService,
    MemoryService,
    ContextService,
    ReasoningService,
    RecommendationService,
  ],
})
export class AssistantModule {}
