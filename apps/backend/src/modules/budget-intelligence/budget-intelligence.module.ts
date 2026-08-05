import { Module } from '@nestjs/common';
import { BudgetIntelligenceController } from './controllers/budget-intelligence.controller';
import { BudgetIntelligenceService } from './services/budget-intelligence.service';
import { FoodCostService } from './services/food-cost.service';
import { MealPlanningService } from './services/meal-planning.service';

@Module({
  controllers: [BudgetIntelligenceController],
  providers: [BudgetIntelligenceService, FoodCostService, MealPlanningService],
  exports: [BudgetIntelligenceService, FoodCostService, MealPlanningService],
})
export class BudgetIntelligenceModule {}
