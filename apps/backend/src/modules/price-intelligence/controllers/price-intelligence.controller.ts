import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import { PriceIntelligenceService } from '../services/price-intelligence.service';
import { PriceCollectionSchedulerService } from '../services/price-collection-scheduler.service';
import { PriceSourceRegistryService } from '../services/price-source-registry.service';
import { PricePersistenceService } from '../services/price-persistence.service';
import { ProductCandidate } from '../services/product-matching.service';

@Controller('price-intelligence')
export class PriceIntelligenceController {
  constructor(
    private readonly priceService: PriceIntelligenceService,
    private readonly scheduler: PriceCollectionSchedulerService,
    private readonly sources: PriceSourceRegistryService,
    private readonly persistence: PricePersistenceService,
  ) {}

  @Get()
  getPrices(@Query('productKey') productKey?: string) { return this.priceService.getLatestPrices(productKey); }

  @Get('sources')
  getSources() { return this.persistence.sources(); }

  @Get('schedule')
  getSchedule(@Query('timezone') timezone?: string) { return this.scheduler.schedule(timezone ? { timezone } : {}); }

  @Get('products/:productKey/history')
  getHistory(@Param('productKey') productKey: string, @Query('from') from?: string, @Query('to') to?: string, @Query('sourceId') sourceId?: string) {
    return this.priceService.getHistory(productKey, from ? new Date(from) : undefined, to ? new Date(to) : undefined, sourceId);
  }

  @Get('products/:productKey/analysis')
  getAnalysis(@Param('productKey') productKey: string) { return this.priceService.analyze(productKey); }

  @Post('match')
  matchProduct(@Body() body: { reference: ProductCandidate; candidates: ProductCandidate[] }) { return this.priceService.matchProduct(body.reference, body.candidates); }

  @Post('nightly/run')
  runNightly(@Body() body: { productKeys?: string[]; sourceIds?: string[]; scheduledFor?: string }) {
    return this.scheduler.collect(body.productKeys ?? [], body.sourceIds, body.scheduledFor ? new Date(body.scheduledFor) : new Date());
  }

  @Post('nightly/preview')
  previewNightly(@Body() body: { now?: string; lastSuccessfulRunAt?: string }) {
    const now = body.now ? new Date(body.now) : new Date();
    const lastSuccessfulRunAt = body.lastSuccessfulRunAt ? new Date(body.lastSuccessfulRunAt) : undefined;
    return this.scheduler.shouldRun(now, lastSuccessfulRunAt);
  }

  @Get('registry')
  getRegistry() { return this.sources.list(); }
}
