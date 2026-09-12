import { Module } from '@nestjs/common';
import { PriceIntelligenceController } from './controllers/price-intelligence.controller';
import { PriceIntelligenceService } from './services/price-intelligence.service';
import { PriceSourceService } from './services/price-source.service';
import { PriceSourceRegistryService } from './services/price-source-registry.service';
import { PricePersistenceService } from './services/price-persistence.service';
import { PriceProductKeyService } from './services/price-product-key.service';
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
    PriceSourceService,
    PriceSourceRegistryService,
    PricePersistenceService,
    PriceProductKeyService,
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
    PriceSourceService,
    PriceSourceRegistryService,
    PricePersistenceService,
    PriceProductKeyService,
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
