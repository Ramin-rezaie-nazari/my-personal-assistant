import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PriceIntelligenceService } from '../services/price-intelligence.service';
import { PriceCollectionSchedulerService } from '../services/price-collection-scheduler.service';
import { PriceSourceRegistryService } from '../services/price-source-registry.service';

@Controller('price-intelligence')
export class PriceIntelligenceController {
  constructor(
    private readonly priceService: PriceIntelligenceService,
    private readonly scheduler: PriceCollectionSchedulerService,
    private readonly sources: PriceSourceRegistryService,
  ) {}

  @Get()
  getPrices() {
    return this.priceService.getLatestPrices();
  }

  @Get('sources')
  getSources() {
    return this.sources.list();
  }

  @Get('schedule')
  getSchedule(@Query('timezone') timezone?: string) {
    return this.scheduler.schedule(timezone ? { timezone } : {});
  }

  @Post('nightly/preview')
  previewNightly(@Body() body: { productKeys?: string[]; sourceIds?: string[]; now?: string; lastSuccessfulRunAt?: string }) {
    const now = body.now ? new Date(body.now) : new Date();
    const lastSuccessfulRunAt = body.lastSuccessfulRunAt ? new Date(body.lastSuccessfulRunAt) : undefined;
    return this.scheduler.shouldRun(now, lastSuccessfulRunAt);
  }
}
