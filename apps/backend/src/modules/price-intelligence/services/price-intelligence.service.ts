import { Injectable } from '@nestjs/common';
import { ProductCandidate, ProductMatchingService } from './product-matching.service';

@Injectable()
export class PriceIntelligenceService {
  constructor(private readonly matching: ProductMatchingService) {}

  async getLatestPrices() {
    return {
      message: 'Latest food prices',
      items: [],
    };
  }

  matchProduct(reference: ProductCandidate, candidates: ProductCandidate[]) {
    const matches = this.matching.match(reference, candidates);
    return {
      accepted: matches.filter((match) => match.confidence >= 0.78 && !match.ambiguous),
      review: matches.filter((match) => match.ambiguous),
      rejected: matches.filter((match) => match.confidence < 0.55),
    };
  }
}
