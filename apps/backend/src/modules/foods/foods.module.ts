import { Module } from '@nestjs/common';
import { FoodsController } from './controllers/foods.controller';
import { FoodsService } from './services/foods.service';
import { FoodSafetyTaxonomyService } from './services/food-safety-taxonomy.service';

@Module({
  controllers: [FoodsController],
  providers: [FoodsService, FoodSafetyTaxonomyService],
  exports: [FoodsService, FoodSafetyTaxonomyService],
})
export class FoodsModule {}
