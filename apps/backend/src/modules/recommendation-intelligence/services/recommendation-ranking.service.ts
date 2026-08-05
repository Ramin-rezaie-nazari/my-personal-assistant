import { Injectable } from '@nestjs/common';

@Injectable()
export class RecommendationRankingService {
  async rankRecommendations() {
    await Promise.resolve();

    return {
      ranked: [],
    };
  }
}
