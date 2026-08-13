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
import { NutritionService } from '../services/nutrition.service';
import { CreateNutritionDto } from '../dto/create-nutrition.dto';

@Controller('nutrition')
@UseGuards(JwtAuthGuard)
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get()
  get(
    @Request() req: { user: { id: string } },
    @Query('dateKey') dateKey?: string,
  ) {
    return this.nutritionService.getLogs(req.user.id, dateKey);
  }

  @Get('summary')
  summary(
    @Request() req: { user: { id: string } },
    @Query('dateKey') dateKey?: string,
  ) {
    return this.nutritionService.getDailySummary(req.user.id, dateKey);
  }

  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateNutritionDto,
  ) {
    return this.nutritionService.createLog(req.user.id, dto);
  }
}
