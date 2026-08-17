import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { PersonalBrainModule } from '../personal-brain/personal-brain.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { DailyModule } from '../daily/daily.module';
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
import { ConversationHistoryService } from './services/conversation-history.service';
import { ConversationContextService } from './services/conversation-context.service';
import { ContextualCommandService } from './services/contextual-command.service';
import { AiProviderRouterService } from './services/ai-provider-router.service';
import { AiCoreGatewayService } from './services/ai-core-gateway.service';
import { PersonalContextService } from './services/personal-context.service';
import { GlobalizationContextService } from './services/globalization-context.service';
import { LocalIntelligenceCoreService } from './services/local-intelligence-core.service';
import { LocalLanguageUnderstandingService } from './services/local-language-understanding.service';
import { DeviceAwareLocalRuntimeService } from './services/device-aware-local-runtime.service';
import { LocalIntelligenceProvider } from './providers/local-intelligence.provider';
import { LocalBasketActionAdapter } from './adapters/local-basket-action.adapter';
import { LocalNutritionActionAdapter } from './adapters/local-nutrition-action.adapter';
import { LocalWaterActionAdapter } from './adapters/local-water-action.adapter';

@Module({
  imports: [PrismaModule, PersonalBrainModule, NutritionModule, DailyModule],
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
    ConversationHistoryService,
    ConversationContextService,
    ContextualCommandService,
    AiProviderRouterService,
    AiCoreGatewayService,
    PersonalContextService,
    GlobalizationContextService,
    LocalIntelligenceCoreService,
    LocalLanguageUnderstandingService,
    DeviceAwareLocalRuntimeService,
    LocalIntelligenceProvider,
    LocalBasketActionAdapter,
    LocalNutritionActionAdapter,
    LocalWaterActionAdapter,
  ],
  exports: [
    AssistantService,
    MemoryService,
    ContextService,
    ReasoningService,
    RecommendationService,
    NaturalActionExecutionService,
    ConversationHistoryService,
    ConversationContextService,
    ContextualCommandService,
    AiProviderRouterService,
    AiCoreGatewayService,
    PersonalContextService,
    GlobalizationContextService,
    LocalIntelligenceCoreService,
    LocalLanguageUnderstandingService,
    DeviceAwareLocalRuntimeService,
  ],
})
export class AssistantModule {}
