# PB-256 — Recipe intelligence package scripts reference missing executables

- Status: PROVISIONAL — operational-script contract finding.
- Location: `apps/backend/package.json`
- Problem: The package manifest defines `recipe-intelligence:nutrition` → `node ./scripts/recipe-nutrition-estimate.mjs` and `recipe-intelligence:score` → `node ./scripts/recipe-recommendation-score.mjs`, but current-main repository search finds no source file for either target.
- Evidence: exact search on audited main found only the package-manifest entries for both filenames. The nutrition executable is present on `agent/mypa-autonomous-control-plane`, and the score executable is also present on that branch. The branch copies therefore establish a lineage discrepancy, not an invalid filename.
- Impact: Both advertised package commands are non-executable on current main and can fail immediately when invoked.
- Reconciliation: This is distinct from PB-206 (workflow commands absent from package scripts), PB-251 (retry-quality target missing on main), and PB-255 (internal dependencies of the v8 local image pipeline missing on main). Final catalog status must determine whether these scripts were intentionally left unmerged or the package entries are stale; branch presence alone does not establish intent.
- Audit-only note: no production code changed.