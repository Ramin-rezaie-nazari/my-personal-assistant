import { Injectable } from '@nestjs/common';

@Injectable()
export class ShoppingListService {
  async generateList() {
    await Promise.resolve();

    return {
      message: 'Shopping list generated',
    };
  }
}
