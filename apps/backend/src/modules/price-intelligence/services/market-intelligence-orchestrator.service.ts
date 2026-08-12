import { Injectable } from '@nestjs/common';
import { MarketAnalysisService } from './market-analysis.service';
import { MarketBudgetImpactService, PlannedPurchase } from './market-budget-impact.service';
import { NightlyMarketIntelligenceService } from './nightly-market-intelligence.service';
import { PriceSourceService } from './price-source.service';

@Injectable()
export class MarketIntelligenceOrchestratorService {
  constructor(
    private readonly nightly: NightlyMarketIntelligenceService,
    private readonly sources: PriceSourceService,
    private readonly analysis: MarketAnalysisService,
    private readonly budget: MarketBudgetImpactService,
  ) {}

  async runNightly(input: { productKeys: string[]; sourceIds?: string[]; scheduledFor?: Date }) {
    return this.nightly.run(input.productKeys, input.sourceIds, input.scheduledFor);
  }

  insight(productKey: string, now = new Date()) {
    return this.analysis.analyze(productKey, now);
  }

  budgetImpact(purchases: PlannedPurchase[], monthlyBudget: number, spent = 0) {
    return this.budget.project(purchases, monthlyBudget, spent);
  }

  availableSources() {
    return this.sources.sources();
  }
}
