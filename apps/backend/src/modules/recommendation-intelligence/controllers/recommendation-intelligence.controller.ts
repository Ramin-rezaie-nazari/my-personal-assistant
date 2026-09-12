import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecommendationEngineService } from '../services/recommendation-engine.service';
import { RecommendationRankingService } from '../services/recommendation-ranking.service';

@Controller('recommendation-intelligence')
@UseGuards(JwtAuthGuard)
export class RecommendationIntelligenceController {
  constructor(private readonly engine: RecommendationEngineService, private readonly ranking: RecommendationRankingService) {}

  @Post('food')
  async food(@Request() req: { user: { id: string } }, @Body() body: { limit?: number }) {
    const candidates = await this.engine.generateFoodRecommendations(req.user.id, body?.limit ?? 10);
    return { recommendations: this.ranking.rankRecommendations(candidates), generatedAt: new Date().toISOString() };
  }
}
