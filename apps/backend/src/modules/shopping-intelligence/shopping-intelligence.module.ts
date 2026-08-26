import { Module } from '@nestjs/common';
import { ShoppingIntelligenceController } from './controllers/shopping-intelligence.controller';
import { ShoppingIntelligenceService } from './services/shopping-intelligence.service';
import { ShoppingListService } from './services/shopping-list.service';
import { PurchaseAnalysisService } from './services/purchase-analysis.service';
import { SmartPurchaseDecisionService } from './services/smart-purchase-decision.service';
import { SmartPurchaseBasketService } from './services/smart-purchase-basket.service';
import { PurchasePlanService } from './services/purchase-plan.service';
import { HouseholdInventoryIntelligenceService } from './services/household-inventory-intelligence.service';
import { HouseholdPurchasePlannerService } from './services/household-purchase-planner.service';
import { HouseholdConsumptionLearningService } from './services/household-consumption-learning.service';
import { HouseholdReorderForecastService } from './services/household-reorder-forecast.service';
import { HouseholdItemNormalizerService } from './services/household-item-normalizer.service';
import { HouseholdInventoryCoreService } from './services/household-inventory-core.service';
import { HouseholdShoppingConsolidatorService } from './services/household-shopping-consolidator.service';
import { HouseholdInventoryPersistenceService } from './services/household-inventory-persistence.service';
import { ShoppingListPersistenceService } from './services/shopping-list-persistence.service';

@Module({
  controllers: [ShoppingIntelligenceController],
  providers: [
    ShoppingIntelligenceService,
    ShoppingListService,
    PurchaseAnalysisService,
    SmartPurchaseDecisionService,
    SmartPurchaseBasketService,
    PurchasePlanService,
    HouseholdInventoryIntelligenceService,
    HouseholdPurchasePlannerService,
    HouseholdConsumptionLearningService,
    HouseholdReorderForecastService,
    HouseholdItemNormalizerService,
    HouseholdInventoryCoreService,
    HouseholdShoppingConsolidatorService,
    HouseholdInventoryPersistenceService,
    ShoppingListPersistenceService,
  ],
  exports: [
    ShoppingIntelligenceService,
    ShoppingListService,
    PurchaseAnalysisService,
    SmartPurchaseDecisionService,
    SmartPurchaseBasketService,
    PurchasePlanService,
    HouseholdInventoryIntelligenceService,
    HouseholdPurchasePlannerService,
    HouseholdConsumptionLearningService,
    HouseholdReorderForecastService,
    HouseholdItemNormalizerService,
    HouseholdInventoryCoreService,
    HouseholdShoppingConsolidatorService,
    HouseholdInventoryPersistenceService,
    ShoppingListPersistenceService,
  ],
})
export class ShoppingIntelligenceModule {}
