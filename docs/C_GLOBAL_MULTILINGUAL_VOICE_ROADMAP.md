# My Personal Assistant — Premium User Experience Roadmap

> C = temporary execution roadmap. A=`docs/05_CURRENT_STATE.md`; B=`docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`; verified outcomes move to A/B only when this workstream is fully validated.

## North star
Build a premium, mature, highly animated, voice-first Personal Operating System interface. Hundreds of capabilities must feel like one simple intelligent assistant. Rich motion is welcome; childish, noisy or game-like UI is not.

**Design freedom rule:** legacy UI is not a constraint. Preserve business logic, data contracts and good accessibility behavior; rewrite presentation from scratch whenever the old surface conflicts with the current MYPA vision.

**Open-design rule:** design authority is unrestricted. Any screen, component, navigation pattern, interaction, animation or information architecture may be rewritten, replaced, deleted or rebuilt from scratch when that produces a materially better MYPA experience. Optimize for the final product, not sunk cost or diff size.

## Repository-side completion
- [x] Premium design tokens, depth, spacing, typography and motion foundation.
- [x] Reusable PremiumGlow / PremiumSurface / PremiumResultCard primitives.
- [x] Reduced-motion support at the shared interaction primitive level.
- [x] Living Voice Core with idle/listening/thinking/acting/speaking/done states.
- [x] Voice Core is a real semantic Pressable interaction instead of a visual-only affordance.
- [x] Persistent voice-first assistant dock reduced to Today / MYPA Core / Settings.
- [x] Assistant Dock respects reduced motion and localizes accessibility labels for RTL.
- [x] Command Center rewritten around the assistant as the primary visual anchor.
- [x] Assistant rewritten as a premium voice-first experience with execution moments and follow-up actions.
- [x] Daily, Meals/Nutrition, Reminders, Calendar, Shopping, Inventory, Recipe Intelligence, Personal Brain, Supplements, Yoga, Habits and Insights on the premium visual language.
- [x] Language, Auth, Onboarding and Settings rewritten with the same visual system.
- [x] Meal Builder, Price Intelligence, Smart Meals and Meal Detail rewritten as premium experiences.
- [x] All currently known direct feature routes are either premium implementations or explicit shell/entry exceptions.
- [x] UI Quality Contract added for foundation, route wiring, RTL hooks, voice states and future-route drift detection.
- [x] UI Quality Contract explicitly checks the Voice Core remains tappable and semantic.
- [x] UI Quality Contract protects the reduced-motion/shared interaction contract.
- [x] CI workflow added for UI quality contract, voice quality contract and mobile typecheck on push/PR.
- [x] Startup entrance shortened so the daily-use premium feel does not become a recurring delay.
- [x] Implicit English Voice Core hint removed so Persian/global UI does not silently mix copy.

## Final validation gates — only remaining
- [ ] Run mobile `typecheck` on the user's current workspace and confirm zero exit.
- [ ] Run UI quality contract and confirm PASS.
- [ ] Run voice-quality contract and confirm PASS.
- [ ] Run backend regression and confirm PASS.
- [ ] Route smoke test through the real Expo app.
- [ ] iOS real-device/development-build review.
- [ ] Android real-device/development-build review.
- [ ] Compact + large phone visual review.
- [ ] Persian/RTL real-device review.
- [ ] Interaction/state regression review, including `acting` → completion.
- [ ] Reduced-motion runtime review.
- [ ] Accessibility focus/touch-target/screen-reader review on device.

## Progress estimate

**Repository-side UI implementation: 100%.**

**Workstream certification: ~97%.** The remaining ~3% is intentionally not guessed: it is the real execution/device validation gate. Code is not promoted to A/B and C is not cleared until those gates are actually observed green.

## Execution rules
Keep design authority fully open. Rewrite anything that makes the product less beautiful, less mature, less coherent or more confusing. Preserve correct business logic, data contracts, accessibility and voice behavior.

For long tests, execute the full suite but surface only failures/errors plus the final summary.

## Definition of done
The workstream is 100% when the repository implementation and all real execution/device validation gates above are green. Only then move the verified outcome into A/B and clear C for the next roadmap.
