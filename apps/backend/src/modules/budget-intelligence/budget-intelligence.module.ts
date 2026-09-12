import { Module } from '@nestjs/common';
import { BudgetIntelligenceController } from './controllers/budget-intelligence.controller';
import { MealPlanningService } from './services/meal-planning.service';
import { GlobalCountryFinanceService } from './services/global-country-finance.service';

@Module({
  controllers: [BudgetIntelligenceController],
  providers: [MealPlanningService, GlobalCountryFinanceService],
  exports: [MealPlanningService, GlobalCountryFinanceService],
})
export class BudgetIntelligenceModule {}
