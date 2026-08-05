import { Module } from '@nestjs/common';
import { MealsController } from './controllers/meals.controller';
import { MealsService } from './services/meals.service';

@Module({
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService],
})
export class MealsModule {}
