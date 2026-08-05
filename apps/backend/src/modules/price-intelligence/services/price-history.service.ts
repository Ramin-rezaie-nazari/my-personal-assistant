import { Injectable } from '@nestjs/common';

@Injectable()
export class PriceHistoryService {
  async savePriceHistory() {
    await Promise.resolve();

    return {
      message: 'Price history saved',
    };
  }
}
