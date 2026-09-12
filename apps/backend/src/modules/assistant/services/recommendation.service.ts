import { Injectable } from '@nestjs/common';

@Injectable()
export class RecommendationService {
  async generateRecommendations() {
    await Promise.resolve();

    return {
      message: 'Recommendation engine ready',
    };
  }
}
