import { Injectable } from '@nestjs/common';
import taxonomy from '../../../../data/ingredient-taxonomy-supplement-v1.json';

export type FoodSafetyFlags = {
  dairy?: boolean;
  animal_derived?: boolean;
  meat?: boolean;
  fish?: boolean;
  gluten_candidate?: boolean;
  tree_nut_candidate?: boolean;
  peanut?: boolean;
  shellfish?: boolean;
  plant_based?: boolean;
  alcohol?: boolean;
};

export type FoodSafetyResolution = {
  status: 'known' | 'unknown';
  canonicalId?: string;
  canonicalName?: string;
  flags: FoodSafetyFlags;
};

type TaxonomyEntry = {
  id: string;
  name: string;
  aliases?: string[];
  flags?: FoodSafetyFlags;
};

const entries = taxonomy as TaxonomyEntry[];

@Injectable()
export class FoodSafetyTaxonomyService {
  resolve(foodName: string): FoodSafetyResolution {
    const normalized = this.normalize(foodName);
    if (!normalized) return { status: 'unknown', flags: {} };

    const match = entries.find((entry) => {
      const names = [entry.name, ...(entry.aliases ?? [])].map((value) =>
        this.normalize(value),
      );
      return names.includes(normalized);
    });

    if (!match) return { status: 'unknown', flags: {} };
    return {
      status: 'known',
      canonicalId: match.id,
      canonicalName: match.name,
      flags: match.flags ?? {},
    };
  }

  evaluate(
    foodNames: string[],
    constraints: {
      allergies?: string[];
      dietaryPreferences?: string[];
    },
  ) {
    const resolutions = foodNames.map((name) => ({ name, ...this.resolve(name) }));
    const allergies = new Set(constraints.allergies ?? []);
    const preferences = new Set(constraints.dietaryPreferences ?? []);

    if (!allergies.size && !preferences.size) {
      return { allowed: true, reason: undefined, resolutions } as const;
    }

    const unknown = resolutions.filter((item) => item.status === 'unknown');
    if (unknown.length) {
      return {
        allowed: false,
        reason: `unknown_food_safety:${unknown.map((item) => item.name).join(',')}`,
        resolutions,
      } as const;
    }

    for (const item of resolutions) {
      const flags = item.flags;
      if (allergies.has('milk') && flags.dairy)
        return this.block(`allergy:milk:${item.name}`, resolutions);
      if (allergies.has('dairy') && flags.dairy)
        return this.block(`allergy:dairy:${item.name}`, resolutions);
      if (allergies.has('eggs') && item.name.toLowerCase().includes('egg'))
        return this.block(`allergy:eggs:${item.name}`, resolutions);
      if (allergies.has('peanuts') && flags.peanut)
        return this.block(`allergy:peanuts:${item.name}`, resolutions);
      if (allergies.has('tree_nuts') && flags.tree_nut_candidate)
        return this.block(`allergy:tree_nuts:${item.name}`, resolutions);
      if (allergies.has('fish') && flags.fish)
        return this.block(`allergy:fish:${item.name}`, resolutions);
      if (allergies.has('shellfish') && flags.shellfish)
        return this.block(`allergy:shellfish:${item.name}`, resolutions);

      if (preferences.has('vegan') && (flags.animal_derived || flags.dairy || flags.meat || flags.fish))
        return this.block(`diet:vegan:${item.name}`, resolutions);
      if (preferences.has('vegetarian') && (flags.meat || flags.fish))
        return this.block(`diet:vegetarian:${item.name}`, resolutions);
      if (preferences.has('gluten_free') && flags.gluten_candidate)
        return this.block(`diet:gluten_free:${item.name}`, resolutions);
    }

    return { allowed: true, reason: undefined, resolutions } as const;
  }

  private block(reason: string, resolutions: Array<{ name: string } & FoodSafetyResolution>) {
    return { allowed: false, reason, resolutions } as const;
  }

  private normalize(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[ۀة]/g, 'ه')
      .replace(/‌/g, ' ')
      .replace(/\s+/g, ' ');
  }
}
