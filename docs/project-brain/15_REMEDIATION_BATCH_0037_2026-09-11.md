# Remediation Batch 0037 — Mobile runtime correctness fixes

Date: 2026-09-11
Branch: `audit/project-brain-2026-09-11`

## Completed source remediation

- Fixed PB-217 in `apps/mobile/app/meals.tsx`: `useMemo` now executes before the loading early-return, preserving hook call order across renders.
- Fixed PB-231 in `apps/mobile/app/yoga.tsx`: replaced the state-driven `setInterval` loop with a cancellation-aware sequential timeout loop so an async tick cannot overlap with another tick or continue after unmount/session completion.

## Verification boundary

These are source-level corrections. Mobile typecheck and device execution are still required for PASS.

## Status

**Source remediated; runtime verification pending.**
