import { Injectable } from '@nestjs/common';
import { ProductCandidate, ProductMatchingService } from './product-matching.service';
import { PricePersistenceService } from './price-persistence.service';
import { MarketAnalysisService } from './market-analysis.service';

@Injectable()
export class PriceIntelligenceService {
  constructor(
    private readonly matching: ProductMatchingService,
    private readonly persistence: PricePersistenceService,
    private readonly analysis: MarketAnalysisService,
  ) {}

  async getLatestPrices(productKey?: string) {
    const items = await this.persistence.latest(productKey);
    return { items };
  }

  async getHistory(productKey: string, from?: Date, to?: Date, sourceId?: string) {
    const items = await this.persistence.history(productKey, from, to, sourceId);
    return { productKey, items };
  }

  analyze(productKey: string) {
    return this.analysis.analyze(productKey);
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
