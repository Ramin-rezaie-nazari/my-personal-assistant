# Global Country Food & Finance Intelligence

## Goal

Make the product global-first without flattening local life into one generic food or money profile.

## Food layer

`GlobalCountryFoodService` provides a deterministic country context for the 195-country sovereign set:

- cuisine family
- staple ingredients
- signature local recipes
- common measurement units
- ingredients that may require specialty sourcing

Local country context is a discovery preference, not a hard restriction. A user in Japan can still ask for Ghormeh Sabzi; explicit recipe intent must remain intact.

### Ranking policy

1. Exact signature-recipe match receives the strongest discovery boost.
2. Matching cuisine family receives a smaller deterministic boost.
3. Other recipes remain visible.
4. No recipe is silently replaced because of the user's country.

### Substitution policy

The public contract keeps cuisine identity, prefers locally available staples, and requires disclosure for culturally important/hard-to-source substitutions.

## Finance layer

`GlobalCountryFinanceService` exposes the local currency metadata for the 195-country set.

Observed prices remain source-native. Currency conversion belongs to comparison/normalization, not raw price storage.

## API

- `GET /recipes/local?countryCode=JP`
- `GET /recipes/countries`
- `GET /budget-intelligence/country?countryCode=JP`
- `GET /budget-intelligence/countries`
- `GET /recipes?countryCode=JP` to deterministically rank the user's existing recipes for local relevance

## Scope boundary

This is the country-routing foundation. It is not yet the complete recipe corpus. The next food-intelligence layers are canonical ingredient taxonomy, region/cuisine normalization, verified recipe corpus/provenance, nutrition provenance, allergens, substitutions at scale, inventory matching, shopping conversion, budget/price integration, and meal planning.
