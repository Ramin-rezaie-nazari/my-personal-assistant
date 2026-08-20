# Global Food Entity Resolution

## Purpose

My Personal Assistant must reason about food by canonical entities, not by raw strings. The same food can have multiple names across languages, countries, stores, brands, recipes, pantry entries, and price feeds.

## Offline-first layers

1. **Canonical taxonomy** — stable ingredient IDs, categories, safety flags and multilingual aliases.
2. **Entity knowledge** — variants and relations such as `variant_of`, `derived_from`, and `related_but_distinct`.
3. **Locale packs** — country/language aliases that map local user or retailer names to canonical IDs without changing the resolver.
4. **Offline resolver** — deterministic normalization, exact alias matching, bounded fuzzy matching, quantity/unit extraction, confidence and review state.
5. **Quantity normalization** — converts compatible units to stable base units with conversion confidence.
6. **Evidence/provenance** — every resolution can carry the matched alias, resolver version and confidence.

## Examples

`olive oil`, `extra virgin olive oil`, and `EVOO` are related but not identical entities. EVOO is a variant of olive oil.

`tomato`, `cherry tomato`, and `Roma tomato` form a parent/variant relationship.

`olive pomace oil` is related to olive oil but remains distinct.

`almond flour` is derived from almond and must not be treated as the same purchasable entity as whole almonds.

## Pantry matching

Pantry and recipes must resolve names before availability checks. A pantry entry such as `روغن زیتون` and a recipe requirement such as `extra virgin olive oil` can resolve to the same canonical family while preserving the variant relationship.

The system must never assume that every variant is interchangeable. Substitution and compatibility rules are separate decisions.

## Price matching

Retail prices must resolve against canonical entity + variant/form + brand/SKU/package context. Raw retailer strings are evidence, not identity.

## Safety

Unknown or ambiguous inputs must remain `review_required=true`. Never invent an allergen, dietary property, variant relationship, or product equivalence merely to improve coverage.

## Globalization

Locale packs are intentionally modular so aliases for all target countries and languages can be added without changing the offline resolver algorithm. The current pack is a seed, not a claim of complete global vocabulary coverage.
