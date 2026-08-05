import { Injectable } from '@nestjs/common';

@Injectable()
export class PurchaseAnalysisService {
  async analyzePurchases() {
    await Promise.resolve();

    return {
      message: 'Purchase behavior analyzed',
    };
  }
}
