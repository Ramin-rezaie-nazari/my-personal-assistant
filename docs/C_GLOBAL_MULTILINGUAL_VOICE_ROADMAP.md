# My Personal Assistant — Premium User Experience Roadmap

> C = temporary execution roadmap. A=`docs/05_CURRENT_STATE.md`; B=`docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`; verified outcomes move to A/B only when this workstream is fully validated.

## North star
Build a premium, mature, highly animated, voice-first Personal Operating System interface. Hundreds of capabilities must feel like one simple intelligent assistant. Rich motion is welcome; childish, noisy or game-like UI is not.

**Design freedom rule:** legacy UI is not a constraint. Preserve business logic, data contracts and good accessibility behavior; rewrite presentation from scratch whenever the old surface conflicts with the current MYPA vision.

## Phase 1 — Visual foundation
- [x] Unified premium color/depth/radius/spacing/motion token layer.
- [x] Reusable animated glow primitive.
- [x] Native reduced-motion preference hook.
- [x] Premium dark surface language established for the Command Center and Assistant.
- [x] Reusable premium surface primitive.
- [x] Premium result-card primitive for contextual outputs and deep-link actions.
- [ ] Expand the surface/button/progress/empty-state library across every feature screen.

## Phase 2 — Command Center
- [x] Redesigned Command Center as a living, dark premium surface rather than a dashboard grid.
- [x] Assistant presence is the primary visual anchor.
- [x] Contextual priorities and progressive visual hierarchy.
- [x] Structured nutrition, habits, reminders and plan summaries.
- [x] Quick actions reduced to a compact contextual strip.
- [x] Premium loading/error/success states.
- [ ] Full visual pass across all linked domain screens.

## Phase 3 — Living Voice
- [x] Voice orb/core redesigned as MYPA's visual heart.
- [x] Distinct state-aware motion for idle/listening/thinking/speaking/done.
- [x] Dedicated `acting` state and visual language added to the voice-core contract.
- [x] Layered glow and orbit/ripple visual language.
- [x] Existing STT/TTS contracts and voice persistence preserved.
- [x] Persistent assistant dock added to the global shell.
- [x] Dedicated premium voice-first assistant screen now uses the living core.
- [ ] Wire real execution lifecycle to `acting` state and validate transitions in runtime.

## Phase 4 — Conversational results
- [x] Premium conversation surface implementation added as the new Assistant experience.
- [x] Clear user vs assistant result presentation.
- [x] Animated voice state transitions represented through the shared core.
- [x] Structured execution metadata remains compact.
- [x] Reusable premium result-card primitive with contextual action chips added.
- [x] Daily and Meals/Nutrition use premium result cards and contextual actions.
- [x] Household/Shopping/Recipe/Brain surfaces now use the same result and action language.
- [ ] Integrate rich result cards/chips directly into Assistant responses for action-specific outcomes.

## Phase 5 — Navigation + information architecture
- [x] Global assistant remains reachable through a compact persistent command dock.
- [x] Main entry route points to the redesigned Command Center.
- [ ] Audit every route and remove unnecessary navigation complexity.
- [ ] Establish one coherent small navigation model for domain areas.
- [ ] Preserve direct voice-first access to every major capability.

## Phase 6 — Motion system
- [x] Central motion duration/easing tokens.
- [x] Shared press/entry motion used in redesigned surfaces and dock.
- [x] Reduced-motion support for primary animated voice surfaces.
- [x] Reduced-motion preference is read from native accessibility settings.
- [x] Animated entry support exists for premium result surfaces.
- [ ] Shared transitions for result cards, navigation and data changes.
- [ ] Meaningful number/progress transitions across the product.
- [ ] Runtime choreography for assistant action → execution → completion.

## Phase 7 — Premium polish
- [x] Premium typography hierarchy, spacing rhythm, depth, shadows and restrained luminous accents established.
- [x] Expo Vector Icons introduced for major command-center/assistant actions.
- [x] Prototype-like text markers reduced in redesigned primary surfaces.
- [x] Daily experience moved onto premium visual language.
- [x] Meals/Nutrition moved onto premium visual language.
- [x] Reminders moved onto premium visual language.
- [x] Calendar moved onto premium visual language.
- [x] Shopping moved onto premium visual language.
- [x] Inventory moved onto premium visual language.
- [x] Recipe Intelligence moved onto premium visual language.
- [x] Personal Brain moved onto premium visual language.
- [ ] Apply same quality to remaining domain/settings screens.
- [ ] Haptic-ready interaction boundaries where supported.

## Phase 8 — Persian + global
- [x] RTL-aware Command Center and Assistant surfaces.
- [x] Mature conversational Persian copy preserved.
- [x] Language remains independent from stored data/business logic.
- [ ] Full RTL audit across every feature route.
- [ ] Locale-aware dates/numbers/units audit across all redesigned surfaces.
- [ ] Long-text/translation-resilience review for premium components.

## Phase 9 — Accessibility + resilience
- [x] Semantic button roles/labels on major redesigned actions.
- [x] Reduced-motion behavior implemented for primary animated voice surfaces.
- [x] Loading/error fallbacks preserved across the redesigned route families.
- [ ] Full touch-target and screen-reader audit across all routes.
- [ ] Dynamic text and keyboard resilience audit.
- [ ] Focus order and voice-over/navigation review for complex cards/modals.

## Phase 10 — Validation
- [ ] Mobile typecheck after the current UI batch.
- [ ] Voice-quality contract remains green after the current UI batch.
- [ ] Backend regression remains green.
- [ ] Route smoke validation.
- [ ] iOS development-build validation.
- [ ] Android development-build validation.
- [ ] Compact/large phone visual review.
- [ ] RTL/Persian review.
- [ ] Interaction/state regression review.
- [ ] Motion/reduced-motion runtime review.
- [ ] Move verified outcomes to A/B and clear C only after the full UI workstream is genuinely green.

## Progress estimate

**Approximate UI roadmap completion: ~68%.** This estimate reflects completed premium experience families plus reusable foundations; it is not a claim of final product quality. The remaining work is concentrated in the remaining routes/settings, navigation consolidation, Assistant action/result choreography, motion polish, global RTL/locale resilience, accessibility and device validation.

## Execution rules
Work continuously from the first unchecked item. Prefer reusable foundations over one-off styling. Do not rewrite domain behavior for visual polish. Preserve voice contracts, user state, accessibility and business logic.

For legacy screens, do not preserve weak presentation just because it already exists. Reuse the underlying data/API/domain behavior when correct; otherwise design and implement the best current version from scratch.

For long tests, execute the full suite but surface only failures/errors plus the final summary.

## Definition of done
100% means the premium visual system, Command Center, voice experience, conversational result surfaces, navigation model, motion system, Persian/RTL behavior, accessibility and required local/device validation are green.