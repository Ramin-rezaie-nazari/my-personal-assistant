# PB-251 — Backend package script references a missing executable

Status: PROVISIONAL — OPERATIONAL/BUILD HIGH

Location: `apps/backend/package.json`, script `recipe-images:retry-quality`, target `apps/backend/scripts/recipe-image-reprocess-retry.mjs`.

Evidence:
- The audited main `apps/backend/package.json` defines `recipe-images:retry-quality` as `node ./scripts/recipe-image-reprocess-retry.mjs`.
- An exact repository search for `recipe-image-reprocess-retry.mjs` returned only the package-manifest reference and no source file on audited main.
- Direct repository-content lookup of the target returned `Not Found` on audited main commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`.
- Historical/parallel branch `agent/mypa-autonomous-control-plane` does contain `apps/backend/scripts/recipe-image-reprocess-retry.mjs`, proving this is a repository-state/lineage discrepancy rather than evidence that the filename is intrinsically invalid.

Impact:
Invoking the advertised `pnpm recipe-images:retry-quality` command cannot execute the intended retry-quality workflow from the audited main repository state because its declared target executable is absent.

Reconciliation:
Keep distinct from PB-196, which concerns the bounded reprocess-quality operation being non-restartable. Keep distinct from PB-255, which concerns missing internal dependencies of the v8 local image pipeline. Final catalog status must determine whether the branch copy is an intentionally unmerged artifact or stale configuration; the audit does not infer intent from branch presence alone.

Audit-only note: no production code changed.