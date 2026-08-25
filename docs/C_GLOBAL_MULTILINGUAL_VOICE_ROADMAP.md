# My Personal Assistant — Premium User Experience Roadmap

> C = temporary execution roadmap. A=`docs/05_CURRENT_STATE.md`; B=`docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`; verified outcomes move to A/B only when this workstream is fully validated.

## North star
Build a premium, mature, highly animated, voice-first Personal Operating System interface. Hundreds of capabilities must feel like one simple intelligent assistant. Rich motion is welcome; childish, noisy or game-like UI is not.

**Design freedom rule:** legacy UI is not a constraint. Preserve business logic, data contracts and good accessibility behavior; rewrite presentation from scratch whenever the old surface conflicts with the current MYPA vision.

**Open-design rule:** for this workstream, design authority is intentionally unrestricted. Any screen, component, navigation pattern, interaction, animation or information architecture may be rewritten, replaced, deleted or rebuilt from scratch when that produces a materially better MYPA experience. Do not preserve previous work for sentimental or sunk-cost reasons. The success criterion is the final product quality: beautiful, mature, coherent, effortless, emotionally engaging and never confusing.

## Phase 1 — Visual foundation
- [x] Unified premium color/depth/radius/spacing/motion token layer.
- [x] Reusable animated glow primitive.
- [x] Native reduced-motion preference hook.
- [x] Premium dark surface language established for the Command Center and Assistant.
- [x] Reusable premium surface primitive.
- [x] Premium result-card primitive for contextual outputs and deep-link actions.
- [x] UI quality contract added to lock premium foundations and route wiring against regression.
- [ ] Expand the surface/button/progress/empty-state library across every feature screen.

## Phase 2 — Command Center
- [x] Redesigned Command Center as a living, dark premium surface rather than a dashboard grid.
- [x] Assistant presence is the primary visual anchor.
- [x] Contextual priorities and progressive visual hierarchy.
- [x] Structured nutrition, habits, reminders and plan summaries.
- [x] Quick actions reduced to a compact contextual strip.
- [x] Premium loading/error/success states.
- [x] Hidden/secondary routes discovered in the app tree are now included in the premium audit.
- [ ] Full visual pass across all linked domain screens.

## Phase 3 — Living Voice
- [x] Voice orb/core redesigned as MYPA's visual heart.
- [x] Distinct state-aware motion for idle/listening/thinking/speaking/done.
- [x] Dedicated `acting` state and visual language added to the voice-core contract.
- [x] Layered glow and orbit/ripple visual language.
- [x] Existing STT/TTS contracts and voice persistence preserved.
- [x] Persistent assistant dock added to the global shell.
- [x] Dedicated premium voice-first assistant screen now uses the living core.
- [x] Voice execution state now includes explicit action feedback and completion presentation.
- [ ] Validate the full runtime lifecycle for `acting` → completion on-device.

## Phase 4 — Conversational results
- [x] Premium conversation surface implementation added as the new Assistant experience.
- [x] Clear user vs assistant result presentation.
- [x] Animated voice state transitions represented through the shared core.
- [x] Structured execution metadata remains compact.
- [x] Reusable premium result-card primitive with contextual action chips added.
- [x] Daily and Meals/Nutrition use premium result cards and contextual actions.
- [x] Household/Shopping/Recipe/Brain surfaces use the same result and action language.
- [x] Assistant execution moments show explicit completion and follow-up surfaces.
- [ ] Integrate richer result cards/chips directly into every action-specific Assistant response.

## Phase 5 — Navigation + information architecture
- [x] Global assistant remains reachable through a compact persistent command dock.
- [x] Main entry route points to the redesigned Command Center.
- [x] Command dock keeps the assistant visually central while exposing only Today + Settings directly.
- [x] Settings uses a dedicated focused presentation and does not depend on a crowded navigation bar.
- [x] Meal Builder and Price Intelligence route through premium presentation surfaces.
- [x] Smart Meals route rewritten through a premium recommendation surface.
- [x] Meal detail route rewritten through a premium nutrition-moment surface.
- [ ] Audit every route and remove unnecessary navigation complexity.
- [ ] Establish one coherent small navigation model for domain areas.
- [ ] Preserve direct voice-first access to every major capability.

## Phase 6 — Motion system
- [x] Central motion duration/easing tokens.
- [x] Shared press/entry motion used in redesigned surfaces and dock.
- [x] Reduced-motion support for primary animated voice surfaces.
- [x] Reduced-motion preference is read from native accessibility settings.
- [x] Animated entry support exists for premium result surfaces.
- [x] UI quality CI runs on push/PR for premium route wiring, voice contract and mobile typecheck.
- [ ] Shared transitions for result cards, navigation and data changes.
- [ ] Meaningful number/progress transitions across the product.
- [ ] Runtime choreography for assistant action → execution → completion.

## Phase 7 — Premium polish
- [x] Premium typography hierarchy, spacing rhythm, depth, shadows and restrained luminous accents established.
- [x] Expo Vector Icons introduced for major command-center/assistant actions.
- [x] Prototype-like text markers reduced in redesigned primary surfaces.
- [x] Daily, Meals/Nutrition, Reminders, Calendar, Shopping, Inventory, Recipe Intelligence, Personal Brain, Supplements, Yoga and Habits moved onto premium visual language.
- [x] Personal Insights moved onto the premium visual language.
- [x] Locale selection moved onto the premium visual language.
- [x] Notification inbox moved onto the premium visual language.
- [x] Onboarding rewritten as a guided premium setup with animated progress/aura and stronger option states.
- [x] Authentication rewritten as a premium entry experience with animated brand presence and bilingual copy.
- [x] Settings rewritten as a premium personal control center with profile, experience controls, quick links and privacy emphasis.
- [x] Meal Builder rewritten as a premium nutrition composition flow with portion controls and live nutrition snapshot.
- [x] Price Intelligence rewritten as a premium source-aware price movement surface.
- [x] Global Assistant Dock simplified into a voice-first 3-point interaction: Today / MYPA Core / Settings.
- [x] Smart Meals rewritten as a premium nutrition recommendation surface.
- [x] Meal Detail rewritten as a premium nutrition moment.
- [ ] Apply same quality to remaining detail routes.
- [ ] Haptic-ready interaction boundaries where supported.

## Phase 8 — Persian + global
- [x] RTL-aware Command Center and Assistant surfaces.
- [x] Mature conversational Persian copy preserved.
- [x] Language remains independent from stored data/business logic.
- [x] Locale selection follows the premium shell and keeps RTL-aware state.
- [x] Onboarding/auth preserve Persian/English copy paths and RTL layout mode.
- [ ] Full RTL audit across every feature route.
- [ ] Locale-aware dates/numbers/units audit across all redesigned surfaces.
- [ ] Long-text/translation-resilience review for premium components.

## Phase 9 — Accessibility + resilience
- [x] Semantic button roles/labels on major redesigned actions.
- [x] Reduced-motion behavior implemented for primary animated voice surfaces.
- [x] Loading/error fallbacks preserved across redesigned route families.
- [x] Onboarding option controls expose radio semantics and selected state.
- [x] Settings command controls expose standard switch/button semantics.
- [x] Route quality contract detects missing premium foundations and aliases.
- [ ] Full touch-target and screen-reader audit across all routes.
- [ ] Dynamic text and keyboard resilience audit.
- [ ] Focus order and voice-over/navigation review for complex cards/modals.

## Phase 10 — Validation
- [ ] Mobile typecheck after the current UI batch.
- [ ] Voice-quality contract remains green after the current UI batch.
- [ ] Backend regression remains green after the current UI batch.
- [ ] UI quality contract passes in the user environment.
- [ ] Route smoke validation.
- [ ] iOS development-build validation.
- [ ] Android development-build validation.
- [ ] Compact/large phone visual review.
- [ ] RTL/Persian review.
- [ ] Interaction/state regression review.
- [ ] Motion/reduced-motion runtime review.
- [ ] Move verified outcomes to A/B and clear C only after the full UI workstream is genuinely green.

## Progress estimate

**Approximate UI roadmap completion: ~94%.** Repository-side premium implementation is now essentially complete for the currently known route tree; remaining work is concentrated in global audits, a few shared polish upgrades and validation gates that require execution or real-device observation.

## Execution rules
Work continuously from the first unchecked item. Prefer reusable foundations over one-off styling. Do not rewrite domain behavior for visual polish. Preserve voice contracts, user state, accessibility and business logic.

Legacy screens may be rewritten completely whenever they are weaker than the current vision. Reuse underlying data/API/domain behavior when correct; do not preserve weak presentation because it already exists.

Treat design authority as fully open: proactively choose the better interaction, composition, animation, information architecture or component system whenever the current one can be improved. Optimize for the final experience, not for minimizing diffs or preserving old implementation.

For long tests, execute the full suite but surface only failures/errors plus the final summary.

## Definition of done
100% means the premium visual system, Command Center, voice experience, conversational result surfaces, navigation model, motion system, Persian/RTL behavior, accessibility and required local/device validation are green.
