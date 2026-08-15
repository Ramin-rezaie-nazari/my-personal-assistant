import { Module } from '@nestjs/common';
import { ContentRecommendationService } from './content-recommendation.service';

@Module({
  providers: [ContentRecommendationService],
  exports: [ContentRecommendationService],
})
export class ContentModule {}
