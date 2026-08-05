import { Module } from '@nestjs/common';

import { RecommendationIntelligenceController } from './controllers/recommendation-intelligence.controller';

import { RecommendationEngineService } from './services/recommendation-engine.service';
import { RecommendationRankingService } from './services/recommendation-ranking.service';
import { PersonalizationService } from './services/personalization.service';

@Module({
  controllers: [RecommendationIntelligenceController],
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
