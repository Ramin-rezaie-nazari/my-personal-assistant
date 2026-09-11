# PB-256 — WITHDRAWN / FALSE POSITIVE RECONCILIATION

Status: WITHDRAWN — current-main targets exist.

The earlier provisional finding claimed that `apps/backend/package.json` referenced missing `recipe-nutrition-estimate.mjs` and `recipe-recommendation-score.mjs` executables.

Direct verification against audited main commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b` shows that **both files exist at the exact declared paths**. Therefore PB-256 is not a current-main package/source contract defect.

The earlier absence result was a stale/incomplete repository-search signal. Direct content lookup is authoritative for this audit decision.

Related logic findings must be evaluated independently against the now-confirmed current-main scripts; PB-199/PB-200 should not be withdrawn solely because of the earlier false absence signal.