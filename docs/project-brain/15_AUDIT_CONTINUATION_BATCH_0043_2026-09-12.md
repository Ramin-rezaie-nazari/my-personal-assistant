# Audit Continuation Batch 0043 — 2026-09-12

Last updated: 2026-09-12
Review status: OPEN — DOCUMENTATION RECONCILIATION REQUIRED

Scope actually read:
- `docs/project-brain/05_API_CATALOG.md`
- current `apps/backend/src/modules/shopping/shopping.controller.ts`
- current `apps/backend/src/modules/shopping-intelligence/controllers/shopping-intelligence.controller.ts`
- current `apps/backend/src/modules/budget-intelligence/controllers/budget-intelligence.controller.ts`
- current `apps/backend/src/modules/price-intelligence/controllers/price-intelligence.controller.ts`

Finding:
- PB-284: API catalog drift. The catalog still contains stale route/guard entries, including `No guard` for active Budget Intelligence, Shopping Intelligence and Price Intelligence paths. Current controllers are JWT protected and route wiring differs from the old snapshot for some parent paths. The catalog must be reconciled while preserving the useful historical route inventory.

Evidence:
- Source controller guard boundaries are current and CI-validated.
- `api_tool.find_in_resource` on the catalog showed stale rows such as `/shopping-intelligence | No guard`, `/budget-intelligence | No guard`, `/budget-intelligence/country | No guard`, `/budget-intelligence/countries | No guard`, `/price-intelligence | No guard`, and Price Intelligence nightly/registry rows marked `No guard`.

Status:
- OPEN — documentation only; no runtime security regression is introduced by this finding because the active controllers themselves have the guard.

Next:
- Replace/reconcile the catalog using current source route inventory and preserve historical context explicitly.
- Re-run final Project Brain consistency checks afterward.
