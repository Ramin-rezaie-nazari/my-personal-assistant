# PB-251 — WITHDRAWN / FALSE POSITIVE RECONCILIATION

Status: WITHDRAWN — current-main target exists.

The earlier provisional finding claimed that `apps/backend/package.json` script `recipe-images:retry-quality` referenced a missing `apps/backend/scripts/recipe-image-reprocess-retry.mjs` executable.

Final direct verification against audited main commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b` shows that the target file **does exist** at that exact path. Therefore PB-251 is not a current-main package/source contract defect.

The earlier absence result was a stale/incomplete repository-search signal and must not be treated as authoritative when direct content lookup succeeds.

Do not retain PB-251 in the canonical findings catalog. PB-196 remains the separate restartability concern for the bounded reprocess-quality operation.