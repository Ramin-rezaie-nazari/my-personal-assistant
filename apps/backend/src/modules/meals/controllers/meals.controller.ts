import { Body, Controller, Get, Post } from '@nestjs/common';
import { MealsService } from '../services/meals.service';
import { CreateMealDto } from '../dto/create-meal.dto';

@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Get()
  findAll() {
    return this.mealsService.findAll('');
  }

  @Post()
  create(@Body() dto: CreateMealDto) {
    return this.mealsService.create('', dto);
  }
}
