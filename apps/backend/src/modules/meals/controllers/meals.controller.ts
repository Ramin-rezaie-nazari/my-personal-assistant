import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MealsService } from '../services/meals.service';
import { CreateMealDto } from '../dto/create-meal.dto';

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.mealsService.findAll(req.user.id);
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateMealDto) {
    return this.mealsService.create(req.user.id, dto);
  }
}
