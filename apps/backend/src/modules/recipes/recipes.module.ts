import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { RecipesController } from './controllers/recipes.controller';
import { RecipesService } from './services/recipes.service';
import { RecipeInventoryMatcherService } from './services/recipe-inventory-matcher.service';

@Module({
  imports: [PrismaModule, NutritionModule],
  controllers: [RecipesController],
  providers: [RecipesService, RecipeInventoryMatcherService],
  exports: [RecipesService, RecipeInventoryMatcherService],
})
export class RecipesModule {}
