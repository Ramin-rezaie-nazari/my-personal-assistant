# C — Visual & Onboarding UX Roadmap

Goal: make the first-use experience feel polished, lively, coherent, personal, and unmistakably MYPA.

## Implementation status
The C implementation is complete on the current workstream. Final device validation is kept separate so we never mark a hardware-dependent item green without actually testing it on the connected Android phone.

## 1. First-launch flow
- [x] Language selection keeps the MYPA visual system instead of the old green theme.
- [x] Onboarding uses one shared visual language: soft ambient glow, layered surfaces, tactile cards, strong typography, restrained motion, and consistent spacing.
- [x] `My Personal Assistant` stays centered on the true screen axis independently of RTL/LTR content flow.
- [x] Persian + English mixed labels are kept visually stable; MYPA is not reordered by RTL layout.
- [x] Plain empty white onboarding surfaces are replaced with a lively MYPA composition.
- [x] Small standalone `Continue ✦` helper text is removed; only the real primary action remains.
- [x] All onboarding content remains scrollable on short Android screens, with bottom actions always reachable.

## 2. Permissions — first-run access model
- [x] A dedicated first-run permissions step explains why MYPA needs access before system prompts.
- [x] Location → country/region detection and local food/recommendation context.
- [x] Microphone → voice conversation with MYPA.
- [x] Camera → movement/form coaching.
- [x] Notifications → reminders and scheduled plans.
- [x] Permission states can be granted, denied, retried, or left for later without blocking the app.
- [x] Only foreground location is requested; no background location is requested.
- [x] Country is detected from device location instead of presenting a 195-country selection list.
- [x] Graceful fallback remains possible when location is unavailable.

## 3. Personal profile
- [x] Gender.
- [x] Age.
- [x] Height.
- [x] Weight.
- [x] Local BMI calculation from height + weight.
- [x] Local-development storage remains independent of Supabase.
- [x] Personalization context exposes body data, country, goal, fitness level, food focus, exercise location, and session duration.
- [x] Onboarding schema is versioned and old completed onboarding can be replayed after a personalization schema change.

## 4. Question 1 — goal
- [x] Ask: `هدفت از تمرینات ورزشی و برنامه غذایی چیه؟`
- [x] Helper copy: `با جواب دادن به این سؤال‌ها بهتر می‌تونم کمکت کنم تا به هدفت برسی.`
- [x] First option: `کاهش چربی و کاهش وزن`.
- [x] Second option: `خوش‌فرم شدن`.
- [x] Third option: `عضله‌سازی و قدرت بیشتر`.
- [x] Fourth option: `سلامت و تناسب اندام عمومی`.
- [x] Goal choices use one primary-goal model for the current onboarding flow.

## 5. Question 2 — fitness level
- [x] Ask: `چه سطحی از تمرینات ورزشی برای شما مناسبه؟`
- [x] Use understandable levels: تازه‌کارم، یکم تجربه دارم، متوسط، پیشرفته.
- [x] Add tiny supporting explanations so first-time users understand the levels.

## 6. Question 3 — food style / focus
- [x] Ask: `دوست داری برنامه غذاییت چجوری باشه؟`
- [x] Helper copy: `از این به بعد بهتر می‌تونم غذاهایی رو بهت معرفی کنم که بیشتر خوشت بیاد.`
- [x] Keep `گیاهخواری` and `وگان` as distinct choices.
- [x] Keep `پروتئین بالا` as a separate preference.
- [x] Add `تمرکز بیشتر روی کاهش وزن` as a stored food-focus choice instead of pretending it is a dietary restriction.
- [x] Food focus is persisted separately from dietary style so the choice is not lost.

## 7. Question 4 — exercise setup
- [x] Remove the old country/context question completely.
- [x] Replace exercise equipment choices with exactly two main locations: `خانه` and `باشگاه`.
- [x] Offer durations: 20 min, 30 min, 45 min, 60 min, 90 min, 2 hours, 3 hours.
- [x] Exercise setup is kept clearly separate from food preferences.

## 8. Visual direction
- [x] Replace the old dark/plain logo treatment with a lively MYPA mark treatment.
- [x] Use consistent MYPA purple + cyan accent language rather than unrelated green branding.
- [x] Keep cards tactile with selected states, icons, border hierarchy, and subtle elevation.
- [x] Keep motion restrained and purposeful.
- [x] Preserve RTL/LTR correctness across all onboarding copy.
- [x] Keep the primary action obvious and visually dominant.
- [x] Avoid childish decoration or overloading the screen with effects.

## 9. MYPA voice — critical product blocker
- [x] Check microphone permission before entering listening mode.
- [x] Check speech-recognition availability before showing an active listening state.
- [x] Explicitly configure Android speech-service package visibility for Google Speech Recognition.
- [x] Explicitly pass the Android recognition service when starting recognition.
- [x] Surface a user-facing error when recognition is unavailable instead of spinning forever.
- [x] Keep manual stop/abort handling available.
- [x] Keep the voice flow independent of Supabase during local development.
- [ ] Verify Persian `fa-IR` recognition on the connected Android phone.
- [ ] Verify transcript → `/assistant` → response → TTS end-to-end on the connected phone.

## 10. Final validation gate
- [x] Code-level onboarding flow reviewed for all requested requirements.
- [x] C roadmap and implementation are aligned.
- [ ] Mobile typecheck green on the final head commit.
- [ ] UI quality contract green on the final head commit.
- [ ] Voice quality contract green on the final head commit.
- [ ] Android build green on the final head commit.
- [ ] Final visual pass on the connected Android phone.
- [ ] Final voice pass on the connected Android phone.

## Definition of Done
C is fully done only when section 10 is also green. Implementation is complete now; hardware/CI validation is intentionally left open until those checks pass.
