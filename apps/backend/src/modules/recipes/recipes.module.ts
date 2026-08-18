import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { RecipesController } from './controllers/recipes.controller';
import { RecipesService } from './services/recipes.service';
import { RecipeInventoryMatcherService } from './services/recipe-inventory-matcher.service';
import { GlobalCountryFoodService } from './services/global-country-food.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecipesController],
  providers: [
    RecipesService,
    RecipeInventoryMatcherService,
    GlobalCountryFoodService,
  ],
  exports: [
    RecipesService,
    RecipeInventoryMatcherService,
    GlobalCountryFoodService,
  ],
})
export class RecipesModule {}
