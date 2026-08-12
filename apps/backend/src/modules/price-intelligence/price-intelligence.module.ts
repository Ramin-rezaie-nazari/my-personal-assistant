import { Module } from '@nestjs/common';
import { PriceIntelligenceController } from './controllers/price-intelligence.controller';
import { PriceIntelligenceService } from './services/price-intelligence.service';
import { PriceHistoryService } from './services/price-history.service';
import { PriceAnalysisService } from './services/price-analysis.service';
import { PriceSourceService } from './services/price-source.service';
import { PriceHistoryStoreService } from './services/price-history-store.service';
import { MarketAnalysisService } from './services/market-analysis.service';
import { MarketBudgetImpactService } from './services/market-budget-impact.service';
import { NightlyMarketIntelligenceService } from './services/nightly-market-intelligence.service';
import { MarketIntelligenceOrchestratorService } from './services/market-intelligence-orchestrator.service';

@Module({
  controllers: [PriceIntelligenceController],
  providers: [
    PriceIntelligenceService,
    PriceHistoryService,
    PriceAnalysisService,
    PriceSourceService,
    PriceHistoryStoreService,
    MarketAnalysisService,
    MarketBudgetImpactService,
    NightlyMarketIntelligenceService,
    MarketIntelligenceOrchestratorService,
  ],
  exports: [
    PriceIntelligenceService,
    PriceHistoryService,
    PriceAnalysisService,
    PriceSourceService,
    PriceHistoryStoreService,
    MarketAnalysisService,
    MarketBudgetImpactService,
    NightlyMarketIntelligenceService,
    MarketIntelligenceOrchestratorService,
  ],
})
export class PriceIntelligenceModule {}
