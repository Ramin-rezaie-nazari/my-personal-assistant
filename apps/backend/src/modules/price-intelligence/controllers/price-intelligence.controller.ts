import { Controller, Get } from '@nestjs/common';
import { PriceIntelligenceService } from '../services/price-intelligence.service';

@Controller('price-intelligence')
export class PriceIntelligenceController {
  constructor(private readonly priceService: PriceIntelligenceService) {}

  @Get()
  getPrices() {
    return this.priceService.getLatestPrices();
  }
}
