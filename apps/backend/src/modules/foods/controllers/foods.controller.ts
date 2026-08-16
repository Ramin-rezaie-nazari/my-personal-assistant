import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FoodsService } from '../services/foods.service';
import { CreateFoodDto } from '../dto/create-food.dto';

@Controller('foods')
@UseGuards(JwtAuthGuard)
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  findAll(
    @Request() req: { user: { id: string } },
    @Query('q') query?: string,
  ) {
    return this.foodsService.findAll(req.user.id, query);
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateFoodDto) {
    return this.foodsService.create(req.user.id, dto);
  }
}
