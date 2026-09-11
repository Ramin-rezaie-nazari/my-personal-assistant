# PB-251 — Backend package script references a missing executable

Status: PROVISIONAL — OPERATIONAL/BUILD HIGH

Location: `apps/backend/package.json`, script `recipe-images:retry-quality`, target `apps/backend/scripts/recipe-image-reprocess-retry.mjs`.

Evidence:
- The audited main `apps/backend/package.json` defines `recipe-images:retry-quality` as `node ./scripts/recipe-image-reprocess-retry.mjs`.
- An exact repository search for `recipe-image-reprocess-retry.mjs` returned only the package-manifest reference and no source file.
- Direct repository-content lookup of `apps/backend/scripts/recipe-image-reprocess-retry.mjs` returned `Not Found` on audited main commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`.

Impact:
Invoking the advertised `pnpm recipe-images:retry-quality` command cannot execute the intended retry-quality workflow from the audited repository state because its declared target executable is absent.

Reconciliation:
This is distinct from PB-196, which concerns the bounded reprocess-quality operation being non-restartable. PB-251 concerns the package entrypoint resolving to a missing executable at all. Before final catalog freeze, reconcile whether the missing file is intentionally external/generated or definitively dead configuration; if definitively dead, merge this evidence into the appropriate existing operational-script finding rather than retaining a duplicate.

Audit-only note: no production code changed.