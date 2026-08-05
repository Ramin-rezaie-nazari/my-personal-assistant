import { Injectable } from '@nestjs/common';

@Injectable()
export class PriceIntelligenceService {
  async getLatestPrices() {
    await Promise.resolve();

    return {
      message: 'Latest food prices',
      items: [],
    };
  }
}
