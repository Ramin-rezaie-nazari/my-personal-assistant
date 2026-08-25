# My Personal Assistant — Premium User Experience Roadmap

> C = temporary execution roadmap. A=`docs/05_CURRENT_STATE.md`; B=`docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`. When this workstream is fully validated, move verified outcomes to A/B and clear C.

## North star

Build a premium, mature, highly animated, voice-first Personal Operating System interface. Hundreds of capabilities must feel like one simple intelligent assistant. Rich motion is welcome; childish, noisy or game-like UI is not.

## Phase 1 — Visual foundation
- [ ] Unified design tokens: color, depth, typography, radii, spacing and motion.
- [ ] Reusable animated surfaces, buttons, chips, progress and empty states.
- [ ] Consistent light/dark premium surface language where practical.
- [ ] Reduced-motion and accessibility conventions.

## Phase 2 — Command Center
- [ ] Redesign into a living Command Center instead of a dashboard grid.
- [ ] Make assistant presence the primary visual anchor.
- [ ] Show only contextual priorities; use progressive disclosure for secondary detail.
- [ ] Animate nutrition, habits, reminders and plan summaries.
- [ ] Replace feature-grid quick actions with elegant contextual actions.
- [ ] Premium loading, error and success states.

## Phase 3 — Living Voice
- [ ] Redesign voice orb/core as MYPA's visual heart.
- [ ] Animated idle/listening/thinking/acting/speaking/done states.
- [ ] Layered glow, orbit/ripple motion and subtle state-specific language.
- [ ] Keep existing STT/TTS contracts and voice persistence unchanged.

## Phase 4 — Conversational results
- [ ] Premium conversation surfaces instead of plain prototype bubbles.
- [ ] Clear distinction between speech, assistant state, actions and results.
- [ ] Animated result entry and execution confirmation.
- [ ] Structured results only when useful; no information dumps.
- [ ] Contextual action chips/deep links.

## Phase 5 — Navigation + information architecture
- [ ] Audit all routes and reduce visible navigation complexity.
- [ ] Keep command-first interaction primary.
- [ ] Establish a small coherent navigation model for nutrition, recipes, pantry, shopping, fitness, reminders, calendar, settings and assistant.
- [ ] Keep assistant globally reachable without clutter.

## Phase 6 — Motion system
- [ ] Centralize motion durations/easings.
- [ ] Shared press/focus/entry/exit transitions.
- [ ] Meaningful progress/number transitions.
- [ ] Reduced-motion support.
- [ ] Motion must never block actions or accessibility.

## Phase 7 — Premium polish
- [ ] Refine typography, spacing rhythm, gradients, glass surfaces, shadows and depth.
- [ ] Refine iconography with existing Expo Vector Icons.
- [ ] Remove prototype-looking symbols and inconsistent controls.
- [ ] Keep interaction boundaries haptic-ready without hard dependency.

## Phase 8 — Persian + global
- [ ] Full RTL audit.
- [ ] Tehran-style Persian identity remains mature, not childish.
- [ ] Locale-aware copy for new surfaces.
- [ ] Language switch cannot mutate data, memory or plans.
- [ ] Locale-aware date/number/unit presentation.

## Phase 9 — Accessibility + resilience
- [ ] Accessible touch targets, labels, hints and roles.
- [ ] Dynamic text resilience.
- [ ] Reduced motion.
- [ ] Usable loading/error fallbacks.
- [ ] Keyboard and screen-reader safe primary interactions.

## Phase 10 — Validation
- [ ] Mobile typecheck.
- [ ] Voice-quality contract.
- [ ] Backend regression remains green.
- [ ] Route smoke validation.
- [ ] iOS development-build validation.
- [ ] Android development-build validation.
- [ ] Compact/large phone visual review.
- [ ] RTL/Persian review.
- [ ] Interaction/state regression review.
- [ ] Move verified results to A/B and clear C only after the slice is genuinely green.

## Execution rules

Work continuously from the first unchecked item. Prefer reusable foundations over one-off styling. Do not rewrite domain behavior for visual polish. Preserve voice contracts, user state, accessibility and business logic.

For long tests, execute the full suite but surface only failures/errors plus the final summary.

## Definition of done

100% means the visual system, Command Center, voice experience, conversation surfaces, navigation, motion system, Persian/RTL behavior, accessibility and required local/device validation are green.