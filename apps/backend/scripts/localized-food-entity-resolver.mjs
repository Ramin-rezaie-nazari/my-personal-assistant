import aliasPacks from '../data/food-entity-alias-packs-v1.json' with { type: 'json' };
import { resolveFoodEntity, getEntityRelations, FOOD_ENTITY_RESOLVER_VERSION } from './food-entity-resolver.mjs';

export const LOCALIZED_FOOD_ENTITY_RESOLVER_VERSION = 'localized-food-entity-resolver-v1';

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const aliases = new Map();
for (const [locale, entities] of Object.entries(aliasPacks.packs || {})) {
  for (const [canonicalId, values] of Object.entries(entities || {})) {
    for (const alias of values || []) {
      aliases.set(normalize(alias), { canonicalId, locale });
    }
  }
}

export function resolveLocalizedFoodEntity(input, options = {}) {
  const raw = String(input || '').trim();
  const locale = options.locale || options.language || null;
  const key = normalize(raw);
  const localeAliases = locale && aliasPacks.packs?.[locale]
    ? new Map(Object.entries(aliasPacks.packs[locale]).flatMap(([canonicalId, values]) => (values || []).map((alias) => [normalize(alias), canonicalId])))
    : null;

  const mappedId = localeAliases?.get(key) ?? aliases.get(key)?.canonicalId;
  if (!mappedId) {
    return { ...resolveFoodEntity(raw, options), localization: { locale, matched: false }, base_resolver_version: FOOD_ENTITY_RESOLVER_VERSION, localized_resolver_version: LOCALIZED_FOOD_ENTITY_RESOLVER_VERSION };
  }

  const resolved = resolveFoodEntity(mappedId, options);
  return {
    ...resolved,
    raw,
    canonical_id: mappedId,
    matched_by: 'localized-alias',
    confidence: .985,
    review_required: false,
    localization: { locale: locale || aliases.get(key)?.locale || null, matched: true },
    relations: getEntityRelations(mappedId),
    base_resolver_version: FOOD_ENTITY_RESOLVER_VERSION,
    localized_resolver_version: LOCALIZED_FOOD_ENTITY_RESOLVER_VERSION,
  };
}
