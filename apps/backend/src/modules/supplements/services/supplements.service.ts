import { Injectable } from '@nestjs/common';

@Injectable()
export class SupplementsService {
  async createSupplement() {
    await Promise.resolve();

    return {
      message: 'Supplement created',
    };
  }

  async getSupplements() {
    await Promise.resolve();

    return [];
  }
}
