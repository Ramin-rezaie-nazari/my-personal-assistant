import { Module } from '@nestjs/common';
import { NutritionController } from './controllers/nutrition.controller';
import { NutritionService } from './services/nutrition.service';
import { RecipeServingScalingService } from './recipe-intelligence/recipe-serving-scaling.service';

@Module({
  controllers: [NutritionController],
  providers: [NutritionService, RecipeServingScalingService],
  exports: [NutritionService, RecipeServingScalingService],
})
export class NutritionModule {}
