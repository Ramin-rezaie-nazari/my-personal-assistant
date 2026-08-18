# Global Country Food & Finance Intelligence

## Goal

The app is global-first without flattening local life into one generic food or money profile.

For the 195-country market set, the backend now has two deterministic country contexts:

- **Food:** cuisine family, staple ingredients, signature local recipes, common units, and ingredients that may need specialty sourcing.
- **Finance:** local currency and fraction digits, with a rule that local prices remain source-native and FX is used only for comparison/normalization.

## Food behavior

`GlobalCountryFoodService` exposes country-aware recipe guidance and ranking.

The local profile is a discovery preference, not a hard restriction. A user in Japan can still request Ghormeh Sabzi; the system does not silently replace it with Sushi. Instead, Japanese local recipes are ranked first for generic meal discovery, while explicit recipe intent is preserved.

Ingredient substitution follows three rules:

1. Preserve cuisine identity.
2. Prefer ingredients normally available in the user's market.
3. Never silently replace a culturally important or hard-to-source ingredient; the UI/assistant should disclose a substitution.

The catalog is intentionally compact and deterministic. It is a cultural routing layer, not a claim that one dish represents an entire country.

## Finance behavior

`GlobalCountryFinanceService` exposes the default local currency for all 195 markets.

The price-intelligence layer remains the source of truth for observed market prices. It preserves source-native currency and country identity. The finance layer must not convert a price just to store it; conversion happens only when a comparison, budget normalization, or cross-country analysis requires it.

## API surface

- `GET /recipes/local?countryCode=JP`
- `GET /recipes/countries`
- `GET /budget-intelligence/country?countryCode=JP`
- `GET /budget-intelligence/countries`

## Existing global market behavior retained

The global market workstream already provides the 195-country market registry, country-aware price collection, local 03:30 scheduling, batching/catch-up, confidence/freshness, source-native currency preservation, and cached FX. This slice adds the country-aware food and finance consumption layer on top of that foundation.

## Verification requirements

The added tests assert exactly 195 country profiles and 195 currency profiles, plus explicit Japan/Iran behavior. Full typecheck, build, Prisma migration deployment, and the existing 155-suite backend test run must still be executed in the user's local repository/CI because this connector cannot execute the user's local PostgreSQL environment.
