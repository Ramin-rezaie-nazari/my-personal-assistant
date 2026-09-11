# Audit Findings Appendix

Last updated: 2026-09-11
Review status: IN_PROGRESS

## New finding

### PB-217 — Mobile Meals route violates React Hook call-order invariant
Status: OPEN — RUNTIME/BUILD HIGH
Location: `apps/mobile/app/meals.tsx`, `MealsScreen()`.
Evidence: `useCallback`, `useEffect`, and `useState` are declared at the top of the component, but `useMemo(() => meals.filter(...), [meals, query])` is declared only after `if (loading) return <View ... />`. On the initial render `loading` is `true`, so the `useMemo` hook is skipped; after `load()` sets `loading` to `false`, the same component instance reaches `useMemo`. This changes the number/order of hooks between renders, violating React's Rules of Hooks and potentially producing a hooks-order runtime error or unstable state behavior.
Impact: the Meals screen can fail or behave unpredictably exactly when transitioning from its loading state to its loaded state. This is independent of the existing PB-216 localization finding and is a concrete runtime correctness issue. Runtime execution was not possible in this audit because the repository could not be run locally.

## Reconciliation
This entry is additive to the existing canonical PB-156 through PB-216 catalogue; prior findings and correction-log IDs must be preserved and not overwritten.
