# Remediation Batch 0036 — Frozen-lockfile contract alignment

Date: 2026-09-11
Branch: `audit/project-brain-2026-09-11`

## Completed source remediation

The root `pnpm-lock.yaml` importer was inspected directly. The backend manifest had two dependency specifiers that diverged from the committed lockfile while resolving to the same installed versions:

- `@nestjs/platform-express`: manifest `^11.0.5` vs lockfile `^11.0.1`
- `class-transformer`: manifest `^0.5.0` vs lockfile `^0.5.1`

The backend `package.json` was aligned to the committed lockfile specifiers without changing resolved package versions. This removes the directly observed manifest/lockfile specifier mismatch that caused the historical frozen-install failure.

## Verification boundary

This is source-level lockfile contract alignment, not a CI PASS. A real `pnpm install --frozen-lockfile` and the affected GitHub Actions workflows must still execute successfully before PB-242 can be closed.

## Status

**Source remediated; CI verification pending.**
