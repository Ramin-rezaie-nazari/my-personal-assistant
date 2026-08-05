import { Injectable } from '@nestjs/common';

@Injectable()
export class PriceAnalysisService {
  async analyzeTrend() {
    await Promise.resolve();

    return {
      message: 'Price trend analyzed',
    };
  }
}
