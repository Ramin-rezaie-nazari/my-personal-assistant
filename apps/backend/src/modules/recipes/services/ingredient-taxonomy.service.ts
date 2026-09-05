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
  confidence: number;
  provenance: 'internal-starter-registry' | 'unresolved-input';
};

type RegistryEntry = Omit<CanonicalIngredient, 'matchedBy'> & { aliases: string[] };

const REGISTRY: RegistryEntry[] = [
  { canonicalKey: 'salt', displayName: 'Salt', foodGroup: 'seasoning', confidence: 1, provenance: 'internal-starter-registry', aliases: ['salt', 'نمک', 'نمک طعام'] },
  { canonicalKey: 'black-pepper', displayName: 'Black pepper', foodGroup: 'seasoning', confidence: 1, provenance: 'internal-starter-registry', aliases: ['black pepper', 'pepper', 'فلفل سیاه', 'فلفل'] },
  { canonicalKey: 'egg', displayName: 'Egg', foodGroup: 'protein', confidence: 1, provenance: 'internal-starter-registry', aliases: ['egg', 'eggs', 'تخم مرغ', 'تخم‌مرغ'] },
  { canonicalKey: 'chicken-breast', displayName: 'Chicken breast', foodGroup: 'protein', confidence: 1, provenance: 'internal-starter-registry', aliases: ['chicken breast', 'سینه مرغ', 'سینهٔ مرغ'] },
  { canonicalKey: 'rice', displayName: 'Rice', foodGroup: 'grain', confidence: 1, provenance: 'internal-starter-registry', aliases: ['rice', 'برنج'] },
  { canonicalKey: 'flour', displayName: 'Flour', foodGroup: 'grain', confidence: 1, provenance: 'internal-starter-registry', aliases: ['flour', 'all-purpose flour', 'آرد'] },
  { canonicalKey: 'milk', displayName: 'Milk', foodGroup: 'dairy', confidence: 1, provenance: 'internal-starter-registry', aliases: ['milk', 'شیر'] },
  { canonicalKey: 'olive-oil', displayName: 'Olive oil', foodGroup: 'fat', confidence: 1, provenance: 'internal-starter-registry', aliases: ['olive oil', 'روغن زیتون'] },
  { canonicalKey: 'sugar', displayName: 'Sugar', foodGroup: 'sweetener', confidence: 1, provenance: 'internal-starter-registry', aliases: ['sugar', 'شکر'] },
  { canonicalKey: 'onion', displayName: 'Onion', foodGroup: 'vegetable', confidence: 1, provenance: 'internal-starter-registry', aliases: ['onion', 'پیاز'] },
  { canonicalKey: 'tomato', displayName: 'Tomato', foodGroup: 'vegetable', confidence: 1, provenance: 'internal-starter-registry', aliases: ['tomato', 'tomatoes', 'گوجه', 'گوجه فرنگی', 'گوجه‌فرنگی'] },
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
    .toLowerCase();
}

const LOOKUP = new Map<string, RegistryEntry>();
for (const entry of REGISTRY) {
  LOOKUP.set(normalizeName(entry.canonicalKey), entry);
  LOOKUP.set(normalizeName(entry.displayName), entry);
  for (const alias of entry.aliases) LOOKUP.set(normalizeName(alias), entry);
}

function resultFromEntry(entry: RegistryEntry, matchedBy: 'canonical' | 'alias'): CanonicalIngredient {
  const { canonicalKey, displayName, foodGroup, confidence, provenance } = entry;
  return { canonicalKey, displayName, foodGroup, matchedBy, confidence, provenance };
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
        confidence: 0,
        provenance: 'unresolved-input',
      };
    }

    const entry = LOOKUP.get(normalized);
    if (entry) {
      const matchedBy =
        normalized === normalizeName(entry.canonicalKey) ||
        normalized === normalizeName(entry.displayName)
          ? 'canonical'
          : 'alias';
      return resultFromEntry(entry, matchedBy);
    }

    return {
      canonicalKey: normalized,
      displayName: name.normalize('NFKC').trim(),
      foodGroup: 'other',
      matchedBy: 'unknown',
      confidence: 0,
      provenance: 'unresolved-input',
    };
  }

  canonicalizeMany(names: string[]): CanonicalIngredient[] {
    return names.map((name) => this.canonicalize(name));
  }

  isKnown(name: string): boolean {
    return this.canonicalize(name).matchedBy !== 'unknown';
  }
}

export const CANONICAL_INGREDIENT_KEYS = REGISTRY.map((entry) => entry.canonicalKey);