import { Injectable } from '@nestjs/common';
import {
  HouseholdItemNormalizerService,
  CanonicalUnit,
} from './household-item-normalizer.service';

export type ShoppingRequirement = {
  productKey: string;
  quantity: number;
  unit: string;
  source?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
};

export type InventoryAvailability = {
  productKey: string;
  quantity: number;
  unit: string;
};

export type ConsolidatedShoppingItem = {
  productKey: string;
  quantity: number;
  unit: CanonicalUnit;
  ownedQuantity: number;
  missingQuantity: number;
  sources: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
};

@Injectable()
export class HouseholdShoppingConsolidatorService {
  constructor(private readonly normalizer: HouseholdItemNormalizerService) {}

  consolidate(
    requirements: ShoppingRequirement[],
    inventory: InventoryAvailability[],
  ): ConsolidatedShoppingItem[] {
    const required = new Map<string, { quantity: number; unit: CanonicalUnit; sources: Set<string>; priority: ConsolidatedShoppingItem['priority'] }>();

    for (const input of requirements) {
      const normalized = this.normalizer.normalizeQuantity(input.quantity, input.unit);
      if (normalized.quantity <= 0) continue;
      const productKey = this.normalizer.canonicalizeProductKey(input.productKey);
      const existing = required.get(productKey);
      if (!existing) {
        required.set(productKey, {
          quantity: normalized.quantity,
          unit: normalized.unit,
          sources: new Set(input.source ? [input.source] : []),
          priority: input.priority ?? 'normal',
        });
        continue;
      }
      if (!this.normalizer.canConvert(existing.unit, normalized.unit)) {
        throw new Error(`Incompatible units for ${productKey}`);
      }
      existing.quantity += this.normalizer.convert(normalized.quantity, normalized.unit, existing.unit);
      if (input.source) existing.sources.add(input.source);
      existing.priority = this.maxPriority(existing.priority, input.priority ?? 'normal');
    }

    const owned = new Map<string, { quantity: number; unit: CanonicalUnit }>();
    for (const input of inventory) {
      const normalized = this.normalizer.normalizeQuantity(input.quantity, input.unit);
      const productKey = this.normalizer.canonicalizeProductKey(input.productKey);
      const existing = owned.get(productKey);
      if (!existing) {
        owned.set(productKey, { quantity: normalized.quantity, unit: normalized.unit });
        continue;
      }
      if (!this.normalizer.canConvert(existing.unit, normalized.unit)) {
        throw new Error(`Incompatible inventory units for ${productKey}`);
      }
      existing.quantity += this.normalizer.convert(normalized.quantity, normalized.unit, existing.unit);
    }

    return [...required.entries()].map(([productKey, entry]) => {
      const ownedEntry = owned.get(productKey);
      if (ownedEntry && !this.normalizer.canConvert(ownedEntry.unit, entry.unit)) {
        throw new Error(`Incompatible units for ${productKey}`);
      }
      const ownedQuantity = ownedEntry
        ? this.normalizer.convert(ownedEntry.quantity, ownedEntry.unit, entry.unit)
        : 0;
      return {
        productKey,
        quantity: entry.quantity,
        unit: entry.unit,
        ownedQuantity,
        missingQuantity: Math.max(0, entry.quantity - ownedQuantity),
        sources: [...entry.sources].sort(),
        priority: entry.priority,
      };
    });
  }

  missingOnly(
    requirements: ShoppingRequirement[],
    inventory: InventoryAvailability[],
  ): ConsolidatedShoppingItem[] {
    return this.consolidate(requirements, inventory).filter((item) => item.missingQuantity > 0);
  }

  private maxPriority(
    a: ConsolidatedShoppingItem['priority'],
    b: ConsolidatedShoppingItem['priority'],
  ): ConsolidatedShoppingItem['priority'] {
    const rank = { low: 0, normal: 1, high: 2, critical: 3 };
    return rank[b] > rank[a] ? b : a;
  }
}
