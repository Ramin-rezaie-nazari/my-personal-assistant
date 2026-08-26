import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { PersonalBrainModule } from '../personal-brain/personal-brain.module';
import { ShoppingModule } from '../shopping/shopping.module';
import { ShoppingIntelligenceModule } from '../shopping-intelligence/shopping-intelligence.module';
import { InventoryModule } from '../inventory/inventory.module';
import { RecipesModule } from '../recipes/recipes.module';
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
import { LocalLanguageUnderstandingService } from './services/local-language-understanding.service';
import { SemanticMultilingualUnderstandingService } from './services/semantic-multilingual-understanding.service';
import { MultilingualConstraintExtractionService } from './services/multilingual-constraint-extraction.service';
import { HouseholdAssistantReadService } from './services/household-assistant-read.service';
import { LocalIntelligenceProvider } from './providers/local-intelligence.provider';
import { LocalBasketActionAdapter } from './adapters/local-basket-action.adapter';

@Module({
  imports: [
    PrismaModule,
    PersonalBrainModule,
    ShoppingModule,
    ShoppingIntelligenceModule,
    InventoryModule,
    RecipesModule,
  ],
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
    LocalLanguageUnderstandingService,
    SemanticMultilingualUnderstandingService,
    MultilingualConstraintExtractionService,
    HouseholdAssistantReadService,
    LocalIntelligenceProvider,
    LocalBasketActionAdapter,
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
    LocalLanguageUnderstandingService,
    SemanticMultilingualUnderstandingService,
    MultilingualConstraintExtractionService,
    HouseholdAssistantReadService,
  ],
})
export class AssistantModule {}
