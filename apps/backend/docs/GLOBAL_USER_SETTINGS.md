# Global User Settings

Global user preferences are persisted through the existing `UserSettings` record plus scoped `UserFact` entries under the `globalization` category.

The assistant-owned contract exposes:

- language tag
- country
- currency
- measurement system
- timezone
- preferred voice profile

`GlobalUserSettingsService` is the single backend boundary for reading and updating this state. `PersonalContextService` consumes the resolved settings so the same context can drive voice, nutrition, shopping, recipes, exercise/content relevance, dates and units.

The persistence layer intentionally reuses the existing `UserFact` extensibility point for the new global fields. This avoids a schema migration while the global settings contract is still evolving. A dedicated relational table can replace this storage later without changing the assistant-facing contract.

All updates are written in one Prisma transaction. Explicitly unsupported voice profiles are rejected rather than silently changing the user's preference.

Authenticated API endpoints:

- `GET /assistant/settings/global`
- `PATCH /assistant/settings/global`
