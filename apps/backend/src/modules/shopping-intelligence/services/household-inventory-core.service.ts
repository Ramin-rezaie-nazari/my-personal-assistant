import { Injectable } from '@nestjs/common';
import {
  CanonicalUnit,
  HouseholdItemNormalizerService,
} from './household-item-normalizer.service';

export type HouseholdInventoryRecord = {
  productKey: string;
  quantity: number;
  unit: CanonicalUnit;
  expiresAt?: Date | null;
};

export type InventoryMutationResult = {
  item: HouseholdInventoryRecord;
  delta: number;
  reason: 'add' | 'consume' | 'adjust' | 'waste';
};

@Injectable()
export class HouseholdInventoryCoreService {
  constructor(private readonly normalizer: HouseholdItemNormalizerService) {}

  add(
    current: HouseholdInventoryRecord | null,
    input: { productKey: string; quantity: number; unit: string; expiresAt?: Date | null },
  ): InventoryMutationResult {
    const normalized = this.normalizeInput(input);
    if (!current) {
      return { item: normalized, delta: normalized.quantity, reason: 'add' };
    }
    if (!this.normalizer.canConvert(current.unit, normalized.unit)) {
      throw new Error(`Cannot merge incompatible inventory units for ${normalized.productKey}`);
    }
    const delta = this.normalizer.convert(normalized.quantity, normalized.unit, current.unit);
    return {
      item: {
        ...current,
        quantity: current.quantity + delta,
        expiresAt: this.preferEarlierExpiry(current.expiresAt, normalized.expiresAt),
      },
      delta,
      reason: 'add',
    };
  }

  consume(
    current: HouseholdInventoryRecord,
    quantity: number,
    unit: string,
  ): InventoryMutationResult {
    const normalizedQuantity = this.normalizer.normalizeQuantity(quantity, unit);
    if (!this.normalizer.canConvert(current.unit, normalizedQuantity.unit)) {
      throw new Error(`Cannot consume incompatible inventory units for ${current.productKey}`);
    }
    const delta = this.normalizer.convert(normalizedQuantity.quantity, normalizedQuantity.unit, current.unit);
    if (delta > current.quantity) {
      throw new Error(`Insufficient inventory for ${current.productKey}`);
    }
    return {
      item: { ...current, quantity: current.quantity - delta },
      delta: -delta,
      reason: 'consume',
    };
  }

  adjust(current: HouseholdInventoryRecord, quantity: number, unit: string): InventoryMutationResult {
    const normalizedQuantity = this.normalizer.normalizeQuantity(quantity, unit);
    const nextQuantity = this.normalizer.convert(
      normalizedQuantity.quantity,
      normalizedQuantity.unit,
      current.unit,
    );
    return {
      item: { ...current, quantity: nextQuantity },
      delta: nextQuantity - current.quantity,
      reason: 'adjust',
    };
  }

  waste(
    current: HouseholdInventoryRecord,
    quantity: number,
    unit: string,
  ): InventoryMutationResult {
    const result = this.consume(current, quantity, unit);
    return { ...result, reason: 'waste' };
  }

  private normalizeInput(input: {
    productKey: string;
    quantity: number;
    unit: string;
    expiresAt?: Date | null;
  }): HouseholdInventoryRecord {
    const normalized = this.normalizer.normalizeQuantity(input.quantity, input.unit);
    return {
      productKey: this.normalizer.canonicalizeProductKey(input.productKey),
      quantity: normalized.quantity,
      unit: normalized.unit,
      expiresAt: input.expiresAt ?? null,
    };
  }

  private preferEarlierExpiry(a?: Date | null, b?: Date | null): Date | null {
    if (!a) return b ?? null;
    if (!b) return a;
    return a.getTime() <= b.getTime() ? a : b;
  }
}
