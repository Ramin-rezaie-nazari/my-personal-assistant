import { Injectable } from '@nestjs/common';

export type CanonicalFoodGroup =
  | 'protein'
  | 'grain'
  | 'vegetable'
  | 'fruit'
  | 'dairy'
  | 'fat'
  | 'legume'
  | 'sweetener'
  | 'seasoning'
  | 'other';

export type CanonicalIngredient = {
  canonicalKey: string;
  displayName: string;
  foodGroup: CanonicalFoodGroup;
  matchedBy: 'canonical' | 'alias' | 'unknown';
};

type RegistryEntry = Omit<CanonicalIngredient, 'matchedBy'> & { aliases: string[] };

const REGISTRY: RegistryEntry[] = [
  { canonicalKey: 'salt', displayName: 'Salt', foodGroup: 'seasoning', aliases: ['salt', 'نمک', 'نمک طعام'] },
  { canonicalKey: 'black-pepper', displayName: 'Black pepper', foodGroup: 'seasoning', aliases: ['black pepper', 'pepper', 'فلفل سیاه', 'فلفل'] },
  { canonicalKey: 'egg', displayName: 'Egg', foodGroup: 'protein', aliases: ['egg', 'eggs', 'تخم مرغ', 'تخم‌مرغ'] },
  { canonicalKey: 'chicken-breast', displayName: 'Chicken breast', foodGroup: 'protein', aliases: ['chicken breast', 'سینه مرغ', 'سینهٔ مرغ'] },
  { canonicalKey: 'rice', displayName: 'Rice', foodGroup: 'grain', aliases: ['rice', 'برنج'] },
  { canonicalKey: 'flour', displayName: 'Flour', foodGroup: 'grain', aliases: ['flour', 'all-purpose flour', 'آرد'] },
  { canonicalKey: 'milk', displayName: 'Milk', foodGroup: 'dairy', aliases: ['milk', 'شیر'] },
  { canonicalKey: 'olive-oil', displayName: 'Olive oil', foodGroup: 'fat', aliases: ['olive oil', 'روغن زیتون'] },
  { canonicalKey: 'sugar', displayName: 'Sugar', foodGroup: 'sweetener', aliases: ['sugar', 'شکر'] },
  { canonicalKey: 'onion', displayName: 'Onion', foodGroup: 'vegetable', aliases: ['onion', 'پیاز'] },
  { canonicalKey: 'tomato', displayName: 'Tomato', foodGroup: 'vegetable', aliases: ['tomato', 'tomatoes', 'گوجه', 'گوجه فرنگی', 'گوجه‌فرنگی'] },
];

function normalizeName(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[يى]/gu, 'ی')
    .replace(/[ك]/gu, 'ک')
    .replace(/\u200c/gu, ' ')
    .replace(/[ـ]/gu, '')
    .replace(/[.,،؛;:!?()[\]{}]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLocaleLowerCase();
}

@Injectable()
export class IngredientTaxonomyService {
  canonicalize(name: string): CanonicalIngredient {
    const normalized = normalizeName(name);
    if (!normalized) {
      return {
        canonicalKey: '',
        displayName: '',
        foodGroup: 'other',
        matchedBy: 'unknown',
      };
    }

    for (const entry of REGISTRY) {
      if (normalized === normalizeName(entry.canonicalKey) || normalized === normalizeName(entry.displayName)) {
        return { ...entry, matchedBy: 'canonical' };
      }
      if (entry.aliases.some((alias) => normalizeName(alias) === normalized)) {
        return { ...entry, matchedBy: 'alias' };
      }
    }

    return {
      canonicalKey: normalized,
      displayName: name.normalize('NFKC').trim(),
      foodGroup: 'other',
      matchedBy: 'unknown',
    };
  }

  isKnown(name: string): boolean {
    return this.canonicalize(name).matchedBy !== 'unknown';
  }
}

export const CANONICAL_INGREDIENT_KEYS = REGISTRY.map((entry) => entry.canonicalKey);
