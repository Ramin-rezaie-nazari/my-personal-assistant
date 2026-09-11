# PB-256 — Recipe intelligence package scripts reference missing executables

- Status: PROVISIONAL — operational-script contract finding.
- Location: `apps/backend/package.json`
- Problem: The package manifest defines `recipe-intelligence:nutrition` → `node ./scripts/recipe-nutrition-estimate.mjs` and `recipe-intelligence:score` → `node ./scripts/recipe-recommendation-score.mjs`, but current-main repository search finds no source file for either target.
- Evidence: exact search for `recipe-nutrition-estimate.mjs` returns only the package manifest entry. Exact search for `recipe-recommendation-score.mjs` likewise returns only the package manifest entry. fileciteturn283file0 fileciteturn284file0
- Impact: Both advertised package commands are non-executable on current main and can fail immediately when invoked. This is distinct from PB-206 (workflow commands absent from package scripts), PB-251 (retry-quality target missing), and PB-255 (internal dependencies of the v8 local image pipeline).
- Reconciliation: Check historical branches/PRs for intentionally omitted recipe-intelligence scripts before deciding whether these are stale commands or missing source artifacts. Do not infer intent from naming alone.
