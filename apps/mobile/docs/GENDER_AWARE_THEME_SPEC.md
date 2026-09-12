# MYPA Gender-Aware Visual Theme Specification

## Purpose

MYPA uses one application architecture and one information hierarchy, but the visual language can adapt to the user's selected profile at onboarding. Gender selection is a visual personalization signal, not a business-logic fork.

## Activation contract

1. The user chooses language.
2. The user reaches the profile/gender step.
3. Tapping **Female** changes the visual theme immediately, without waiting for onboarding completion.
4. The selected theme remains active across every remaining onboarding step and every later route.
5. Tapping **Male** restores the existing default MYPA visual language.
6. Other/undisclosed choices use the existing default theme unless a future visual-preference system says otherwise.
7. Theme state persists locally through AsyncStorage and must not require a network request.

## Female visual language

The female theme should feel premium, warm, energetic, elegant and unmistakably feminine without becoming childish, pink-only, glittery, or stereotypical.

### Core palette

- Canvas: `#FFF7FB`
- Surface: `#FFFFFF`
- Raised surface: `#FFF9FC`
- Border: `#F2D4E2`
- Text: `#291522`
- Soft text: `#76566A`
- Primary berry/rose: `#E83E78`
- Strong rose: `#C92C67`
- Soft rose: `#FFF0F6`
- Coral: `#FF6F61`
- Turquoise: `#18B7B0`
- Sky blue: `#56A7FF`
- Violet supporting accent: `#8B5CF6`

### Visual balance

The palette is not intended to turn every surface pink. Pink/rose establishes the identity; coral adds energy; turquoise and sky-blue provide freshness and prevent the environment from feeling monochromatic. Violet remains a secondary bridge to the existing MYPA identity.

## Global rules

### Background

Every route should remain inside the female visual world. Large translucent pink, coral, turquoise and sky-blue atmospheric forms may be used behind content, but they must never reduce text readability.

### Surfaces

Cards should use warm-white surfaces with rose-tinted borders and subtle elevation. Dark premium screens should migrate toward a deep berry/plum variant instead of retaining a visually unrelated navy/amber palette.

### Primary actions

Primary CTAs should use rose/berry. Pressed state should become slightly darker and scale subtly. Destructive actions may use coral/red but must remain visually distinct from ordinary primary actions.

### Secondary actions

Use warm-white surfaces with rose-tinted borders and muted plum text.

### Selection

Selected choices use soft rose surfaces or a strong rose fill depending on control hierarchy. Selected icons and labels must maintain accessible contrast.

### Decorative accents

Turquoise and sky-blue are supporting accents for illustrations, data highlights, wellness/health states, and micro-decoration. They must not replace rose as the main brand identity.

### Typography

Typography hierarchy and font family remain shared between genders. The theme changes color, emphasis, illustration treatment and motion—not the information architecture.

### Motion

Female mode may use softer spring-like micro-interactions, gentle scale/opacity transitions, floating decorative elements and polished onboarding transitions. Animations must remain fast enough for low-end devices.

### Icons and illustrations

Icons should use the semantic theme tokens. Supporting illustration accents can combine rose, coral, turquoise and sky-blue. Avoid gender stereotypes such as hearts, lipstick, dresses or excessive sparkle as the primary visual language.

## Route coverage requirement

The visual contract applies to all mobile routes, including but not limited to:

- onboarding
- home/dashboard
- assistant/brain
- daily
- meals and meal builder
- recipes and recipe matching
- inventory
- shopping
- price intelligence
- fitness
- yoga
- calisthenics
- gym/workout
- habits
- reminders
- notifications
- supplements
- calendar
- settings
- global settings
- auth and startup surfaces after gender state is known

No route should silently revert to the male/default palette after female mode is selected.

## Implementation architecture

- `AppThemeProvider` is the single source of reactive theme state.
- `useAppTheme()` is the only UI-facing theme access point for new code.
- Theme persistence uses `APP_THEME_STORAGE_KEY`.
- Business logic, API payloads, nutrition decisions, fitness decisions and recommendation algorithms must remain independent of theme mode.
- The existing default theme is preserved as the male/default experience.
- Screens should progressively replace direct `BRAND.colors.*` / `PREMIUM.colors.*` styling with semantic theme tokens.
- Legacy hard-coded screens may temporarily receive global atmosphere treatment, but a route is not considered fully theme-migrated until its primary surfaces, typography, controls, icons and states use semantic tokens.

## Completion gate

The gender-aware visual work is complete only when:

1. Female selection changes the visual language immediately.
2. Male/default remains visually stable.
3. Female mode survives app restart.
4. All major routes use the female semantic palette.
5. No premium sub-route silently returns to unrelated colors.
6. Focused theme/persistence tests pass.
7. Mobile typecheck passes.
8. Android and iOS real-device validation confirms layout, contrast, motion and performance.
