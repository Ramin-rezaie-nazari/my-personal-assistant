import { Body, Controller, Get, Post } from '@nestjs/common';
import { FoodsService } from '../services/foods.service';
import { CreateFoodDto } from '../dto/create-food.dto';

@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  findAll() {
    return this.foodsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateFoodDto) {
    return this.foodsService.create(dto);
  }
}
