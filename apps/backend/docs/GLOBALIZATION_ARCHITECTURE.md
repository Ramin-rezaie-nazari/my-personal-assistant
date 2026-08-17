# Globalization architecture

My Personal Assistant is designed as a global product rather than an Iran-only application.

## Core rule

Language, country/region, currency, units, timezone, and food region are separate concepts. A locale such as `es-ES` identifies language/region for localization, while monetary calculations must retain an explicit ISO-style currency code.

The backend uses BCP 47 / Unicode-style locale tags and ISO-style country and currency codes at the application boundary. Unicode CLDR defines these identifiers and explicitly distinguishes locale, territory, language, currency, and unit data.

## Current contract

`GlobalizationContextService` resolves a lightweight context containing:

- `languageTag`
- `languageCode`
- `countryCode`
- `currencyCode`
- `measurementSystem`
- `timezone`
- `direction`
- `foodRegion`

This service is intentionally independent of persistence. It can therefore be used immediately by the AI core, recommendation engines, pricing, shopping, nutrition, and UI without forcing a database migration into the first globalization step.

## Important product behavior

Country must influence food and market recommendations. A user in Spain should not receive Iran-specific food/pricing assumptions merely because the assistant itself was first developed in Iran.

Currency is kept as an explicit code whenever financial calculations are involved. A country default may be used for convenience when it is known, but the application must not infer an ambiguous currency from a symbol alone.

Measurement system is also independent. The runtime currently supports metric, US customary, and UK imperial profiles.

## Future persistence

The next globalization layer should persist explicit user choices for country, currency, measurement preferences, and locale overrides. Those values should be surfaced into `PersonalContext` and therefore into the AI core and recommendation engines.

## Future localization data

Large locale catalogs, language names, country names, plural rules, date formats, unit preferences, currency display rules, and food-region catalogs should be sourced from a maintained internationalization dataset rather than hard-coded ad hoc application strings.
