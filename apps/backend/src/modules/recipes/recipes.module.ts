import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { ShoppingModule } from '../shopping/shopping.module';
import { BudgetIntelligenceModule } from '../budget-intelligence/budget-intelligence.module';
import { RecipesController } from './controllers/recipes.controller';
import { RecipeLibraryController } from './controllers/recipe-library.controller';
import { RecipesService } from './services/recipes.service';
import { RecipeLibraryService } from './services/recipe-library.service';
import { RecipeInventoryMatcherService } from './services/recipe-inventory-matcher.service';
import { GlobalCountryFoodService } from './services/global-country-food.service';
import { FoodOperatingLoopService } from './services/food-operating-loop.service';
import { IngredientTaxonomyService } from './services/ingredient-taxonomy.service';
import { FoodContextNormalizationService } from './services/food-context-normalization.service';

@Module({
  imports: [PrismaModule, NutritionModule, ShoppingModule, BudgetIntelligenceModule],
  controllers: [RecipesController, RecipeLibraryController],
  providers: [
    RecipesService,
    RecipeLibraryService,
    RecipeInventoryMatcherService,
    GlobalCountryFoodService,
    FoodOperatingLoopService,
    IngredientTaxonomyService,
    FoodContextNormalizationService,
  ],
  exports: [
    RecipesService,
    RecipeLibraryService,
    RecipeInventoryMatcherService,
    GlobalCountryFoodService,
    FoodOperatingLoopService,
    IngredientTaxonomyService,
    FoodContextNormalizationService,
  ],
})
export class RecipesModule {}
