import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/database/prisma.module';
import { RecipesModule } from '../recipes/recipes.module';
import { RecommendationIntelligenceController } from './controllers/recommendation-intelligence.controller';
import { FoodRecommendationController } from './controllers/food-recommendation.controller';
import { RecommendationEngineService } from './services/recommendation-engine.service';
import { RecommendationRankingService } from './services/recommendation-ranking.service';
import { PersonalizationService } from './services/personalization.service';

@Module({
  imports: [PrismaModule, RecipesModule],
  controllers: [RecommendationIntelligenceController, FoodRecommendationController],
  providers: [
    RecommendationEngineService,
    RecommendationRankingService,
    PersonalizationService,
  ],
  exports: [
    RecommendationEngineService,
    RecommendationRankingService,
    PersonalizationService,
  ],
})
export class RecommendationIntelligenceModule {}
