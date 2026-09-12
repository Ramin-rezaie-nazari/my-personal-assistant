import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { PriceIntelligenceModule } from '../price-intelligence/price-intelligence.module';
import { BudgetIntelligenceController } from './controllers/budget-intelligence.controller';
import { BudgetIntelligenceService } from './services/budget-intelligence.service';
import { MealPlanningService } from './services/meal-planning.service';
import { GlobalCountryFinanceService } from './services/global-country-finance.service';

@Module({
  imports: [InventoryModule, PriceIntelligenceModule],
  controllers: [BudgetIntelligenceController],
  providers: [
    BudgetIntelligenceService,
    MealPlanningService,
    GlobalCountryFinanceService,
  ],
  exports: [
    BudgetIntelligenceService,
    MealPlanningService,
    GlobalCountryFinanceService,
  ],
})
export class BudgetIntelligenceModule {}
