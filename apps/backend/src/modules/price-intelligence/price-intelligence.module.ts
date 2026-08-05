import { Module } from '@nestjs/common';
import { PriceIntelligenceController } from './controllers/price-intelligence.controller';
import { PriceIntelligenceService } from './services/price-intelligence.service';
import { PriceHistoryService } from './services/price-history.service';
import { PriceAnalysisService } from './services/price-analysis.service';

@Module({
  controllers: [PriceIntelligenceController],
  providers: [
    PriceIntelligenceService,
    PriceHistoryService,
    PriceAnalysisService,
  ],
  exports: [
    PriceIntelligenceService,
    PriceHistoryService,
    PriceAnalysisService,
  ],
})
export class PriceIntelligenceModule {}
