# My Personal Assistant — Branding

## Brand idea

**My Personal Assistant** is a friendly, contextual, action-oriented life assistant. The visual identity should feel calm and intelligent rather than clinical or overly futuristic.

## Canonical lockup

Name: **My Personal Assistant**

Tagline: **Your day. Your goals. Your assistant.**

Short descriptor: **PERSONAL · CONTEXTUAL · ACTIONABLE**

Source assets:

- `apps/mobile/assets/branding/mark.svg` — canonical mark
- `apps/mobile/assets/branding/logo.svg` — dark lockup
- `apps/mobile/assets/branding/splash.svg` — startup artwork

## Mark

The mark uses a central assistant core with four connected nodes. The connections represent the product's core behavior: goals, context, decisions, and actions are connected rather than treated as separate utilities.

## Color system

Primary purple: `#6D28D9`

Primary violet: `#7C3AED`

Soft violet: `#A78BFA`

Action cyan: `#22D3EE`

Startup navy: `#070B1A`

Startup surface: `#111A39`

App canvas: `#F7F8FA`

Surface: `#FFFFFF`

Ink: `#111827`

Muted text: `#6B7280`

Border: `#E5E7EB`

## Usage rules

Use purple as the main action color. Use cyan as an accent or signal, not as a primary fill. Use the dark startup palette only for startup/assistant-brand surfaces. Keep the normal app canvas light and low-contrast.

Do not reintroduce emoji as the product logo. Product surfaces should use `BrandMark` or `BrandWordmark` from `apps/mobile/components`.

## Typography

Use the platform system font for performance and localization compatibility. The visual hierarchy is carried by weight, size, spacing, and color rather than by bundling a custom font.

Primary display: 31px / 900

Product title: 24px / 900

Body: 14px / regular to 700

Control label: 12px / 800–900

## Mobile implementation

Brand tokens live in `apps/mobile/lib/branding.ts`.

Reusable components:

- `BrandMark` — mark-only treatment
- `BrandWordmark` — mark plus product name/tagline

The root shell uses the same branding for startup and the persistent assistant entry point, keeping the product identity consistent across first launch and daily use.
