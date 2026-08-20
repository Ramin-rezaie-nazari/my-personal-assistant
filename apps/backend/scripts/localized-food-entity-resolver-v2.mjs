import aliasPacks from '../data/food-entity-alias-packs-v1.json' with { type: 'json' };
import { resolveFoodEntity, getEntityById, getEntityRelations, FOOD_ENTITY_RESOLVER_VERSION } from './food-entity-resolver-v2.mjs';

export const LOCALIZED_FOOD_ENTITY_RESOLVER_VERSION = 'localized-food-entity-resolver-v2';

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

const allAliasMap = new Map();
for (const [locale, entities] of Object.entries(aliasPacks.packs || {})) {
  for (const [canonicalId, values] of Object.entries(entities || {})) {
    for (const alias of values || []) allAliasMap.set(normalize(alias), { canonicalId, locale });
  }
}

export function resolveLocalizedFoodEntity(input, options = {}) {
  const raw = String(input || '').trim();
  const key = normalize(raw);
  const requestedLocale = options.locale || options.language || null;
  const localePack = requestedLocale ? aliasPacks.packs?.[requestedLocale] : null;
  const localeMap = localePack
    ? new Map(Object.entries(localePack).flatMap(([id, values]) => (values || []).map((alias) => [normalize(alias), id])))
    : null;
  const mapped = localeMap?.get(key) ?? allAliasMap.get(key)?.canonicalId;
  if (!mapped) return { ...resolveFoodEntity(raw), localization: { matched: false, locale: requestedLocale }, localized_resolver_version: LOCALIZED_FOOD_ENTITY_RESOLVER_VERSION };

  const entity = getEntityById(mapped);
  if (!entity) return { ...resolveFoodEntity(raw), localization: { matched: false, locale: requestedLocale, reason: 'alias_target_missing' }, localized_resolver_version: LOCALIZED_FOOD_ENTITY_RESOLVER_VERSION };

  return {
    resolver_version: FOOD_ENTITY_RESOLVER_VERSION,
    localized_resolver_version: LOCALIZED_FOOD_ENTITY_RESOLVER_VERSION,
    raw,
    normalized: key,
    canonical_id: mapped,
    canonical_name: entity.name,
    category: entity.category || null,
    matched_alias: key,
    matched_by: 'localized-alias',
    confidence: .99,
    review_required: false,
    quantity: null,
    unit: null,
    parent_id: entity.parent_id || null,
    relations: getEntityRelations(mapped),
    flags: entity.flags || {},
    localization: { matched: true, locale: requestedLocale || allAliasMap.get(key)?.locale || null },
  };
}
