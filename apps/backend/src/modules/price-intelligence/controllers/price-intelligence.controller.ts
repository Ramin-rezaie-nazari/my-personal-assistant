import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PriceIntelligenceService } from '../services/price-intelligence.service';
import { PriceCollectionSchedulerService } from '../services/price-collection-scheduler.service';
import { PriceSourceRegistryService } from '../services/price-source-registry.service';
import { PricePersistenceService } from '../services/price-persistence.service';
import { GlobalPriceCollectionService } from '../services/global-price-collection.service';
import {
  MatchProductDto,
  NightlyPreviewDto,
  NightlyRunDto,
} from '../dto/price-intelligence.dto';

@Controller('price-intelligence')
@UseGuards(JwtAuthGuard)
export class PriceIntelligenceController {
  constructor(
    private readonly priceService: PriceIntelligenceService,
    private readonly scheduler: PriceCollectionSchedulerService,
    private readonly sources: PriceSourceRegistryService,
    private readonly persistence: PricePersistenceService,
    private readonly globalPrices: GlobalPriceCollectionService,
  ) {}

  @Get()
  getPrices(
    @Query('productKey') productKey?: string,
    @Query('countryCode') countryCode?: string,
  ) {
    return this.priceService.getLatestPrices(productKey, countryCode);
  }

  @Get('sources')
  getSources() {
    return this.persistence.sources();
  }

  @Get('schedule')
  getSchedule(@Query('timezone') timezone?: string) {
    return this.scheduler.schedule(timezone ? { timezone } : {});
  }

  @Get('products/:productKey/history')
  getHistory(
    @Param('productKey') productKey: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sourceId') sourceId?: string,
    @Query('countryCode') countryCode?: string,
  ) {
    return this.priceService.getHistory(
      productKey,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      sourceId,
      countryCode,
    );
  }

  @Get('products/:productKey/analysis')
  getAnalysis(
    @Param('productKey') productKey: string,
    @Query('countryCode') countryCode?: string,
  ) {
    return this.priceService.analyze(productKey, countryCode);
  }

  @Get('global-coverage')
  getGlobalCoverage() {
    return this.globalPrices.coverage();
  }

  @Post('match')
  matchProduct(@Body() dto: MatchProductDto) {
    return this.priceService.matchProduct(dto.reference, dto.candidates);
  }

  @Post('nightly/run')
  runNightly(@Body() dto: NightlyRunDto) {
    return this.scheduler.collect(
      dto.productKeys,
      dto.sourceIds,
      dto.scheduledFor ? new Date(dto.scheduledFor) : new Date(),
    );
  }

  @Post('nightly/preview')
  previewNightly(@Body() dto: NightlyPreviewDto) {
    const now = dto.now ? new Date(dto.now) : new Date();
    const lastSuccessfulRunAt = dto.lastSuccessfulRunAt
      ? new Date(dto.lastSuccessfulRunAt)
      : undefined;
    return this.scheduler.shouldRun(now, lastSuccessfulRunAt);
  }

  @Get('registry')
  getRegistry() {
    return this.sources.list();
  }
}
