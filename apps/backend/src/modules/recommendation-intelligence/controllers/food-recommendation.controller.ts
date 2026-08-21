import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateRecommendationDto } from '../dto/create-recommendation.dto';
import { RecommendationEngineService } from '../services/recommendation-engine.service';

@Controller('recommendation-intelligence')
@UseGuards(JwtAuthGuard)
export class FoodRecommendationController {
  constructor(private readonly recommendationEngine: RecommendationEngineService) {}

  @Post('food')
  recommendFood(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateRecommendationDto,
  ) {
    return this.recommendationEngine.generateRecommendations(req.user.id, dto);
  }
}
