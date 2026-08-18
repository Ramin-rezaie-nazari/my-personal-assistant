import { Module } from '@nestjs/common';
import { PriceIntelligenceController } from './controllers/price-intelligence.controller';
import { PriceIntelligenceService } from './services/price-intelligence.service';
import { PriceHistoryService } from './services/price-history.service';
import { PriceAnalysisService } from './services/price-analysis.service';
import { PriceSourceService } from './services/price-source.service';
import { PriceSourceRegistryService } from './services/price-source-registry.service';
import { GlobalMarketSourceRegistryService } from './services/global-market-source-registry.service';
import { GlobalMarketScheduleService } from './services/global-market-schedule.service';
import { GlobalMarketAutomaticSchedulerService } from './services/global-market-automatic-scheduler.service';
import { FxRateService } from './services/fx-rate.service';
import { PriceConfidenceService } from './services/price-confidence.service';
import { PriceHistoryStoreService } from './services/price-history-store.service';
import { PricePersistenceService } from './services/price-persistence.service';
import { MarketAnalysisService } from './services/market-analysis.service';
import { MarketBudgetImpactService } from './services/market-budget-impact.service';
import { NightlyMarketIntelligenceService } from './services/nightly-market-intelligence.service';
import { PriceCollectionSchedulerService } from './services/price-collection-scheduler.service';
import { AutomaticPriceSchedulerService } from './services/automatic-price-scheduler.service';
import { MarketIntelligenceOrchestratorService } from './services/market-intelligence-orchestrator.service';
import { ProductMatchingService } from './services/product-matching.service';
import { PrismaModule } from '../../common/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PriceIntelligenceController],
  providers: [
    PriceIntelligenceService,
    PriceHistoryService,
    PriceAnalysisService,
    PriceSourceService,
    PriceSourceRegistryService,
    GlobalMarketSourceRegistryService,
    GlobalMarketScheduleService,
    GlobalMarketAutomaticSchedulerService,
    FxRateService,
    PriceConfidenceService,
    PriceHistoryStoreService,
    PricePersistenceService,
    MarketAnalysisService,
    MarketBudgetImpactService,
    NightlyMarketIntelligenceService,
    PriceCollectionSchedulerService,
    AutomaticPriceSchedulerService,
    MarketIntelligenceOrchestratorService,
    ProductMatchingService,
  ],
  exports: [
    PriceIntelligenceService,
    PriceHistoryService,
    PriceAnalysisService,
    PriceSourceService,
    PriceSourceRegistryService,
    GlobalMarketSourceRegistryService,
    GlobalMarketScheduleService,
    GlobalMarketAutomaticSchedulerService,
    FxRateService,
    PriceConfidenceService,
    PriceHistoryStoreService,
    PricePersistenceService,
    MarketAnalysisService,
    MarketBudgetImpactService,
    NightlyMarketIntelligenceService,
    PriceCollectionSchedulerService,
    AutomaticPriceSchedulerService,
    MarketIntelligenceOrchestratorService,
    ProductMatchingService,
  ],
})
export class PriceIntelligenceModule {}
