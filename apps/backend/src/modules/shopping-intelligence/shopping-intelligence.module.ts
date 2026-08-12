import { Module } from '@nestjs/common';
import { ShoppingIntelligenceController } from './controllers/shopping-intelligence.controller';
import { ShoppingIntelligenceService } from './services/shopping-intelligence.service';
import { ShoppingListService } from './services/shopping-list.service';
import { PurchaseAnalysisService } from './services/purchase-analysis.service';
import { SmartPurchaseDecisionService } from './services/smart-purchase-decision.service';
import { SmartPurchaseBasketService } from './services/smart-purchase-basket.service';
import { PurchasePlanService } from './services/purchase-plan.service';

@Module({
  controllers: [ShoppingIntelligenceController],
  providers: [
    ShoppingIntelligenceService,
    ShoppingListService,
    PurchaseAnalysisService,
    SmartPurchaseDecisionService,
    SmartPurchaseBasketService,
    PurchasePlanService,
  ],
  exports: [
    ShoppingIntelligenceService,
    ShoppingListService,
    PurchaseAnalysisService,
    SmartPurchaseDecisionService,
    SmartPurchaseBasketService,
    PurchasePlanService,
  ],
})
export class ShoppingIntelligenceModule {}
