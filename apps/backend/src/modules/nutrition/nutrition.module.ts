import { Module } from '@nestjs/common';
import { NutritionController } from './controllers/nutrition.controller';
import { NutritionService } from './services/nutrition.service';

@Module({
  controllers: [NutritionController],
  providers: [NutritionService],
  exports: [NutritionService],
})
export class NutritionModule {}
