import { Module } from '@nestjs/common';
import { PriceIntelligenceModule } from '../price-intelligence/price-intelligence.module';
import { BudgetIntelligenceController } from './controllers/budget-intelligence.controller';
import { BudgetIntelligenceService } from './services/budget-intelligence.service';
import { FoodCostService } from './services/food-cost.service';
import { MealPlanningService } from './services/meal-planning.service';
import { GlobalCountryFinanceService } from './services/global-country-finance.service';

@Module({
  imports: [PriceIntelligenceModule],
  controllers: [BudgetIntelligenceController],
  providers: [
    BudgetIntelligenceService,
    FoodCostService,
    MealPlanningService,
    GlobalCountryFinanceService,
  ],
  exports: [
    BudgetIntelligenceService,
    FoodCostService,
    MealPlanningService,
    GlobalCountryFinanceService,
  ],
})
export class BudgetIntelligenceModule {}
