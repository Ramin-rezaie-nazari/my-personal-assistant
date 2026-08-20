import aliasPacks from '../data/food-entity-alias-packs-v1.json' with { type: 'json' };
import { getEntityById, getEntityRelations, resolveCanonicalId, resolveFoodEntity, FOOD_ENTITY_RESOLVER_VERSION } from './food-entity-resolver-final.mjs';

export const LOCALIZED_FOOD_ENTITY_RESOLVER_VERSION = 'localized-food-entity-resolver-v3-final';

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[-_/]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const globalAliasMap = new Map();
for (const [locale, entities] of Object.entries(aliasPacks.packs || {})) {
  for (const [canonicalId, aliases] of Object.entries(entities || {})) {
    for (const alias of aliases || []) globalAliasMap.set(normalize(alias), { canonicalId, locale });
  }
}

export function resolveLocalizedFoodEntity(input, options = {}) {
  const raw = String(input || '').trim();
  const key = normalize(raw);
  const requestedLocale = options.locale || options.language || null;
  const localEntities = requestedLocale ? aliasPacks.packs?.[requestedLocale] : null;
  const localAliasMap = localEntities
    ? new Map(Object.entries(localEntities).flatMap(([id, aliases]) => (aliases || []).map((alias) => [normalize(alias), id])))
    : null;
  const mapping = localAliasMap?.get(key) ? { canonicalId: localAliasMap.get(key), locale: requestedLocale } : globalAliasMap.get(key);

  if (!mapping) return { ...resolveFoodEntity(raw), localized_resolver_version: LOCALIZED_FOOD_ENTITY_RESOLVER_VERSION, localization: { matched: false, locale: requestedLocale } };

  const entity = getEntityById(mapping.canonicalId);
  if (!entity) return { ...resolveFoodEntity(raw), localized_resolver_version: LOCALIZED_FOOD_ENTITY_RESOLVER_VERSION, localization: { matched: false, locale: mapping.locale, reason: 'alias_target_missing' } };

  const canonical = resolveCanonicalId(mapping.canonicalId, raw);
  const base = resolveFoodEntity(raw);
  return {
    ...canonical,
    quantity: base.quantity,
    unit: base.unit,
    matched_alias: key,
    matched_by: 'localized-alias',
    confidence: .99,
    localization: { matched: true, locale: mapping.locale },
    localized_resolver_version: LOCALIZED_FOOD_ENTITY_RESOLVER_VERSION,
    resolver_version: FOOD_ENTITY_RESOLVER_VERSION,
    relations: getEntityRelations(mapping.canonicalId),
  };
}
