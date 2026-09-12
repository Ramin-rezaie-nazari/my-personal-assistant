import { Injectable } from '@nestjs/common';

@Injectable()
export class PriceProductKeyService {
  fromFoodName(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase('fa-IR')
      .replace(/[\u200c\s]+/g, '-')
      .replace(/[^\p{L}\p{N}-]+/gu, '')
      .slice(0, 180);
  }
}
