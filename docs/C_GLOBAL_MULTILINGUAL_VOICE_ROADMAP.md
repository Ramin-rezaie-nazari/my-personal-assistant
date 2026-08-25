# My Personal Assistant — Premium User Experience Roadmap

> C = temporary execution roadmap. A=`docs/05_CURRENT_STATE.md`; B=`docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`. When this workstream is fully validated, move verified outcomes to A/B and clear C.

## Current checkpoint

**Approximate roadmap progress: ~55%.** This percentage is for the Premium UI/UX workstream only, not the whole MYPA product. It is based on completed capability groups and validation gates, not number of files changed.

**Design rule:** do not preserve an old screen merely because it exists. Existing UI is a reference for business behavior and routes, not a visual constraint. If an old screen conflicts with the current MYPA vision, it should be rewritten from scratch rather than cosmetically patched.

## North star
Build the most polished, mature, highly animated, voice-first Personal Operating System interface we can reasonably make: memorable on first open, elegant enough to feel premium, simple enough to use daily, and never childish, noisy or game-like. Hundreds of capabilities must feel like one intelligent companion.

## Phase 1 — Visual foundation
- [x] Unified premium color/depth/radius/spacing/motion token layer.
- [x] Reusable animated glow primitive.
- [x] Native reduced-motion preference hook.
- [x] Premium dark surface language established for the Command Center and Assistant.
- [x] Reusable premium surface primitive.
- [x] Premium result-card primitive for contextual outputs and deep-link actions.
- [ ] Expand surface/button/progress/empty-state library across every feature screen.
- [ ] Add final typography/icon hierarchy and shared elevation recipes across all routes.

## Phase 2 — Command Center
- [x] Redesigned Command Center as a living, dark premium surface rather than a dashboard grid.
- [x] Assistant presence is the primary visual anchor.
- [x] Contextual priorities and progressive visual hierarchy.
- [x] Structured nutrition, habits, reminders and plan summaries.
- [x] Quick actions reduced to a compact contextual strip.
- [x] Premium loading/error/success states.
- [ ] Full visual pass across all linked domain screens.
- [ ] Dynamic personalized content hierarchy based on context and current priorities.

## Phase 3 — Living Voice
- [x] Voice orb/core redesigned as MYPA's visual heart.
- [x] Distinct state-aware motion for idle/listening/thinking/speaking/done.
- [x] Dedicated `acting` state and visual language added to the voice-core contract.
- [x] Layered glow and orbit/ripple visual language.
- [x] Existing STT/TTS contracts and voice persistence preserved.
- [x] Persistent assistant dock added to the global shell.
- [x] Dedicated premium voice-first assistant screen now uses the living core.
- [ ] Wire real execution lifecycle to `acting` state and validate transitions in runtime.
- [ ] Finalize voice state microcopy and haptic-ready state transitions.

## Phase 4 — Conversational results
- [x] Premium conversation surface implementation added as the new Assistant experience.
- [x] Clear user vs assistant result presentation.
- [x] Animated voice state transitions are represented through the shared core.
- [x] Structured execution metadata remains compact.
- [x] Reusable premium result-card primitive with contextual action chips added.
- [x] Daily surface uses premium result cards and contextual actions.
- [x] Meals/Nutrition surface uses premium result cards, contextual actions and premium meal cards.
- [ ] Integrate rich result cards/chips into Assistant responses for action-specific outcomes.
- [ ] Define result presentation patterns for confirmations, progress, warnings, failures and multi-step plans.

## Phase 5 — Navigation + information architecture
- [x] Global assistant remains reachable through a compact persistent command dock.
- [x] Main entry route points to the redesigned Command Center.
- [ ] Audit all routes and remove unnecessary navigation complexity.
- [ ] Establish a coherent small navigation model for domain areas.
- [ ] Preserve direct voice-first access to every major capability.
- [ ] Allow assistant-driven deep links without making navigation feel like a separate system.

## Phase 6 — Motion system
- [x] Central motion duration/easing tokens.
- [x] Shared press/entry motion used in redesigned surfaces and dock.
- [x] Reduced-motion support for the primary animated voice surface.
- [x] Reduced-motion preference is read from native accessibility settings.
- [x] Animated entry support exists for premium result surfaces.
- [ ] Shared transitions for result cards, domain navigation and data changes.
- [ ] Meaningful number/progress transitions across the product.
- [ ] Coordinated multi-element motion sequences for major actions without motion overload.

## Phase 7 — Premium polish
- [x] Premium typography hierarchy, spacing rhythm, depth, shadows and restrained luminous accents established in the new shell.
- [x] Expo Vector Icons introduced for major command-center/assistant actions.
- [x] Prototype-like text markers reduced in redesigned primary surfaces.
- [x] Daily experience moved onto the premium visual language.
- [x] Meals/Nutrition experience moved onto the premium visual language.
- [ ] Apply the same visual language to recipe, inventory, shopping, fitness, reminder and settings screens.
- [ ] Replace old screens with fresh rewrites when the old visual structure conflicts with the new design direction.
- [ ] Haptic-ready interaction boundaries where supported.
- [ ] Fine visual QA for spacing, contrast, typography, density and animation rhythm.

## Phase 8 — Persian + global
- [x] RTL-aware Command Center and Assistant surfaces.
- [x] Mature conversational Persian copy preserved.
- [x] Language remains independent from stored data/business logic.
- [ ] Full RTL audit across every feature route.
- [ ] Locale-aware presentation audit for dates/numbers/units on all redesigned surfaces.
- [ ] Verify premium visual hierarchy remains culturally and linguistically natural in Persian/RTL.

## Phase 9 — Accessibility + resilience
- [x] Semantic button roles/labels on major redesigned actions.
- [x] Reduced-motion behavior implemented for primary animated voice surfaces.
- [x] Loading/error fallbacks preserved in redesigned Command Center, Assistant, Daily and Meals.
- [ ] Full touch-target and screen-reader audit across all routes.
- [ ] Dynamic text and keyboard resilience audit.
- [ ] Verify animations never block actions or create inaccessible interaction states.

## Phase 10 — Validation
- [ ] Mobile typecheck after the full current UI batch.
- [ ] Voice-quality contract remains green after the full current UI batch.
- [ ] Backend regression remains green.
- [ ] Route smoke validation.
- [ ] iOS development-build validation.
- [ ] Android development-build validation.
- [ ] Compact/large phone visual review.
- [ ] RTL/Persian review.
- [ ] Interaction/state regression review.
- [ ] Move verified outcomes to A/B and clear C only after the full UI workstream is genuinely green.

## Execution rules
Work continuously from the first unchecked item. Prefer reusable foundations over one-off styling. Existing screens are **not** sacred: keep working business behavior, but rewrite the visual layer from scratch when the existing structure prevents the target experience. Do not rewrite domain behavior merely for visual polish. Preserve voice contracts, user state, accessibility and business logic. For long tests, execute the full suite but surface only failures/errors plus the final summary.

## Definition of done
100% means the premium visual system, Command Center, living voice experience, conversational result surfaces, navigation model, motion system, fresh premium treatment of all major feature screens, Persian/RTL behavior, accessibility and required local/device validation are green.