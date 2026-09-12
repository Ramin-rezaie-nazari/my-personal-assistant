import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { ShoppingModule } from '../shopping/shopping.module';
import { ShoppingIntelligenceController } from './controllers/shopping-intelligence.controller';
import { ShoppingIntelligenceService } from './services/shopping-intelligence.service';
import { ShoppingListService } from './services/shopping-list.service';
import { PurchaseAnalysisService } from './services/purchase-analysis.service';
import { SmartPurchaseDecisionService } from './services/smart-purchase-decision.service';
import { SmartPurchaseBasketService } from './services/smart-purchase-basket.service';
import { PurchasePlanService } from './services/purchase-plan.service';
import { HouseholdInventoryIntelligenceService } from '../inventory/household-inventory-intelligence.service';
import { HouseholdPurchasePlannerService } from './services/household-purchase-planner.service';
import { HouseholdConsumptionLearningService } from './services/household-consumption-learning.service';
import { HouseholdReorderForecastService } from './services/household-reorder-forecast.service';

@Module({
  imports: [InventoryModule, ShoppingModule],
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
  ],
})
export class ShoppingIntelligenceModule {}
