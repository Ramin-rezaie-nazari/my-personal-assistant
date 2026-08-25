# My Personal Assistant — Premium User Experience Roadmap

> C = temporary execution roadmap. A=`docs/05_CURRENT_STATE.md`; B=`docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`. When this workstream is fully validated, move verified outcomes to A/B and clear C.

## North star
Build a premium, mature, highly animated, voice-first Personal Operating System interface. Hundreds of capabilities must feel like one simple intelligent assistant. Rich motion is welcome; childish, noisy or game-like UI is not.

## Phase 1 — Visual foundation
- [x] Unified premium color/depth/radius/spacing/motion token layer.
- [x] Reusable animated glow primitive.
- [x] Reduced-motion accessibility hook.
- [x] Premium dark surface language established for the Command Center.
- [ ] Reusable surface/button/progress/empty-state library expanded across every feature screen.

## Phase 2 — Command Center
- [x] Redesigned Command Center as a living, dark premium surface rather than a dashboard grid.
- [x] Assistant presence is the primary visual anchor.
- [x] Contextual priorities and progressive visual hierarchy.
- [x] Animated/structured nutrition, habits, reminders and plan summaries.
- [x] Quick actions reduced to a compact contextual strip.
- [x] Premium loading/error/success states.
- [ ] Full visual pass across all linked domain screens.

## Phase 3 — Living Voice
- [x] Voice orb/core redesigned as MYPA's visual heart.
- [x] Distinct state-aware motion for idle/listening/thinking/speaking/done.
- [x] Layered glow and orbit/ripple visual language.
- [x] Existing STT/TTS contracts and voice persistence preserved.
- [x] Persistent assistant dock added to the global shell.
- [ ] Acting state needs a dedicated execution animation/state surface in the conversational UI.

## Phase 4 — Conversational results
- [ ] Premium conversation surfaces instead of current prototype chat styling.
- [ ] Clear distinction between speech, assistant state, action and completed result.
- [ ] Animated result entry and execution confirmation.
- [ ] Structured result cards/chips with progressive disclosure.
- [ ] Contextual deep-link action chips.

## Phase 5 — Navigation + information architecture
- [x] Global assistant remains reachable through a compact persistent dock.
- [x] Main entry route already points to the redesigned Command Center.
- [ ] Audit all routes and remove unnecessary navigation complexity.
- [ ] Establish a coherent small navigation model for domain areas.
- [ ] Preserve direct voice-first access to every major capability.

## Phase 6 — Motion system
- [x] Central motion duration/easing tokens.
- [x] Shared press/entry motion used in the redesigned Command Center and dock.
- [x] Reduced-motion support for the living voice core.
- [ ] Shared transitions for result cards, domain navigation and data changes.
- [ ] Meaningful number/progress transitions across the product.

## Phase 7 — Premium polish
- [x] Premium typography hierarchy, spacing rhythm, depth, shadows and restrained luminous accents established in the new shell.
- [x] Expo Vector Icons introduced for major command-center actions.
- [x] Prototype-like text markers reduced in the redesigned command center.
- [ ] Apply the same polish to assistant, daily, nutrition, recipe, inventory, shopping, fitness, reminder and settings screens.
- [ ] Haptic-ready interaction boundaries where supported.

## Phase 8 — Persian + global
- [x] RTL-aware Command Center layout.
- [x] Persian copy keeps a mature conversational identity.
- [x] Language remains independent from stored data/business logic.
- [ ] Full RTL audit across every feature route.
- [ ] Locale-aware presentation audit for dates/numbers/units on all redesigned surfaces.

## Phase 9 — Accessibility + resilience
- [x] Semantic button roles and labels added to major redesigned actions.
- [x] Reduced-motion behavior implemented for the primary animated voice surface.
- [x] Loading and error fallbacks preserved in the redesigned Command Center.
- [ ] Full touch-target and screen-reader audit across all routes.
- [ ] Dynamic text and keyboard resilience audit.

## Phase 10 — Validation
- [ ] Mobile typecheck after the current UI batch.
- [ ] Existing voice-quality contract remains green after the current UI batch.
- [ ] Backend regression remains green.
- [ ] Route smoke validation.
- [ ] iOS development-build validation.
- [ ] Android development-build validation.
- [ ] Compact/large phone visual review.
- [ ] RTL/Persian review.
- [ ] Interaction/state regression review.
- [ ] Move verified outcomes to A/B and clear C only after the full UI workstream is genuinely green.

## Execution rules
Work continuously from the first unchecked item. Prefer reusable foundations over one-off styling. Do not rewrite domain behavior for visual polish. Preserve voice contracts, user state, accessibility and business logic. For long tests, execute the full suite but surface only failures/errors plus the final summary.

## Definition of done
100% means the premium visual system, Command Center, voice experience, conversational result surfaces, navigation model, motion system, Persian/RTL behavior, accessibility and required local/device validation are green.