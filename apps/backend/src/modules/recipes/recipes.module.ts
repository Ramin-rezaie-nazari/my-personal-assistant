import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { ShoppingModule } from '../shopping/shopping.module';
import { BudgetIntelligenceModule } from '../budget-intelligence/budget-intelligence.module';
import { RecipesController } from './controllers/recipes.controller';
import { RecipesService } from './services/recipes.service';
import { RecipeInventoryMatcherService } from './services/recipe-inventory-matcher.service';
import { GlobalCountryFoodService } from './services/global-country-food.service';
import { FoodOperatingLoopService } from './services/food-operating-loop.service';

@Module({
  imports: [PrismaModule, NutritionModule, ShoppingModule, BudgetIntelligenceModule],
  controllers: [RecipesController],
  providers: [
    RecipesService,
    RecipeInventoryMatcherService,
    GlobalCountryFoodService,
    FoodOperatingLoopService,
  ],
  exports: [
    RecipesService,
    RecipeInventoryMatcherService,
    GlobalCountryFoodService,
    FoodOperatingLoopService,
  ],
})
export class RecipesModule {}
