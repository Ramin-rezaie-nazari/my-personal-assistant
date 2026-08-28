# C — Visual & Onboarding UX Roadmap

Goal: make the first-use experience feel polished, lively, coherent, personal, and unmistakably MYPA before adding more product surface area.

## Critical — MYPA voice assistant must work
- [ ] Fix the main-screen MYPA voice orb so tapping it reliably enters a real listening state instead of spinning indefinitely.
- [ ] Verify Android speech-recognition service discovery and explicitly support the Google speech recognition service on compatible devices.
- [ ] Ensure microphone permission is requested/checked correctly before starting recognition.
- [ ] Check speech-recognition availability before entering the listening animation.
- [ ] Surface a real user-facing error when speech recognition is unavailable, rather than leaving the UI in a perpetual loading/listening state.
- [ ] Verify Persian (`fa-IR`) speech recognition on the connected Android phone.
- [ ] Verify voice transcript → `/assistant` API → assistant response → TTS end-to-end.
- [ ] Rebuild the native Android app after speech-recognition config changes; Metro reload alone is not sufficient for native plugin changes.
- [ ] Add an explicit manual stop/retry path for listening failures.
- [ ] Keep voice behavior independent of Supabase during local development.

## Language screen
- [x] Replace standalone green visual palette with the MYPA visual system.
- [x] Improve logo treatment and overall composition.
- [ ] Audit all spacing, typography, RTL alignment, and copy after visual pass.

## Personalization data — priority immediately after language
- [ ] Add an early personal profile step immediately after language selection (before the broader five onboarding questions, unless a better flow is designed).
- [ ] Ask for gender in a simple, friendly way.
- [ ] Ask for age or date of birth.
- [ ] Ask for height.
- [ ] Ask for weight.
- [ ] Store these values in the local development profile first; keep architecture ready for later Supabase migration.
- [ ] Calculate BMI locally from height + weight.
- [ ] Feed these values into the local recommendation/decision engine together with goals, fitness level, and food preferences so workout and meal recommendations can be more personalized.
- [ ] Keep this step lightweight and conversational; it should not feel like a medical questionnaire.
- [ ] Consider later optional inputs (activity level, body-fat %, limitations/injuries, etc.) without making first-run onboarding unnecessarily long.

## Onboarding — global UX
- [x] Keep all five question screens scrollable on short/small Android screens.
- [x] Keep Back / Continue actions accessible.
- [ ] Remove the small standalone `Continue ✦` helper text below the options on every onboarding screen; keep only the real primary Continue button.
- [ ] Establish a richer visual system: depth, subtle gradients/glows, meaningful iconography, stronger cards, motion, and more character while keeping the interface simple.
- [ ] Ensure the five screens feel like one coherent product journey rather than plain forms.
- [ ] Do not treat each screen as a separate visual design; define one shared visual language and apply it consistently to all onboarding screens.
- [ ] Replace plain white / empty backgrounds with a polished, lively composition that has visual depth and avoids feeling sterile, generic, or lifeless.
- [ ] Replace the current ugly/dark logo treatment on all onboarding screens with the final MYPA brand mark.
- [ ] Keep `My Personal Assistant` horizontally centered on the true screen axis, independent of the RTL text flow.
- [ ] Ensure Persian copy keeps Persian word order while allowing MYPA / English words to remain visually stable; prevent mixed Persian-English strings from appearing reordered or awkward.
- [ ] Design the screens to create a strong first-impression moment within the first few seconds: premium, friendly, energetic, modern, alive, and clearly related to MYPA.
- [ ] Treat shared branding/background/typography/iconography as a single system across all onboarding screens.

## Personal profile — location and access
- [ ] Remove the current country/location question from onboarding completely.
- [ ] Determine the user's country from the device location instead of asking them to choose a country manually.
- [ ] Request location permission clearly and intentionally on first app launch, before the app needs country-aware recommendations.
- [ ] Explain in friendly, non-technical language why location helps (for local food, routines, recommendations, availability/context) before showing the OS permission prompt.
- [ ] Request the minimum location permission needed for country/region context; do not request background location unless a later feature genuinely requires it.
- [ ] Handle denied/unavailable location gracefully with a manual country fallback in settings/profile rather than blocking the user.
- [ ] Keep the local-development implementation independent of Supabase so it can later migrate cleanly.

## Screen 1 — goals
- [x] Rewrite the question to explicitly ask: `هدفت از تمرینات ورزشی و برنامه غذایی چیه؟`
- [x] Replace the weak helper copy with: `با جواب دادن به این سؤال‌ها بهتر می‌تونم کمکت کنم تا به هدفت برسی.`
- [x] Make option 1 `کاهش چربی و کاهش وزن`.
- [x] Keep option 2 as `خوش‌فرم شدن` but review wording/visual emphasis so it reads naturally for both nutrition and exercise.
- [x] Make option 3 muscle-focused: `عضله‌سازی و قدرت بیشتر` (or equivalent concise wording).
- [ ] Add a fourth option that is clearly understandable as a general health/fitness goal, not an ambiguous catch-all.
- [ ] Review whether this screen should support one primary goal only or a primary + secondary goal, based on future recommendation logic.
- [ ] Remove the current standalone small `ادامه ✦` helper beneath the options; keep only the main Continue button.

## Screen 2 — fitness level
- [x] Rewrite the question to: `چه سطحی از تمرینات ورزشی برای شما مناسبه؟`
- [ ] Review option labels so a first-time user immediately understands what each level means.
- [ ] Consider adding tiny supporting descriptions/examples to reduce ambiguity.
- [ ] Remove the current standalone small `ادامه ✦` helper beneath the options; keep only the main Continue button.

## Screen 3 — food preferences
- [x] Rewrite the question to: `دوست داری برنامه غذاییت چجوری باشه؟`
- [x] Rewrite helper copy to: `از این به بعد بهتر می‌تونم غذاهایی رو بهت معرفی کنم که بیشتر خوشت بیاد.`
- [ ] Re-check all food options for clarity and whether they feel relevant to meal recommendations rather than exercise.
- [ ] Use distinct dietary options for `گیاه‌خواری` and `وگان`; do not duplicate the meaning.
- [ ] Replace the duplicate/overlapping food option with `کاهش وزن` as requested for the current onboarding flow.
- [ ] Separate dietary style/restrictions from general food preferences later if recommendation quality benefits from it.
- [ ] Ensure `خوش‌فرم شدن` is treated as a cross-domain goal where appropriate, not an exercise-only concept.
- [ ] Remove the current standalone small `ادامه ✦` helper beneath the options; keep only the main Continue button.

## Screen 4 — context
- [ ] Remove this onboarding question entirely.
- [ ] Replace the manual country-selection step with device-location based country/region detection.
- [ ] Keep a manual country fallback available later in profile/settings when location permission is denied or unavailable.
- [ ] Remove the current standalone small `ادامه ✦` helper beneath the options; keep only the main Continue button where the shared onboarding action remains.

## Screen 5 — exercise setup
- [ ] Ensure this screen is clearly and exclusively about exercise setup, equipment, and available session time.
- [ ] Review whether the current split between equipment and duration is the cleanest UX.
- [ ] Remove the current standalone small `ادامه ✦` helper beneath the options; keep only the main Continue button.
- [ ] Keep exercise location simple: home and gym are the primary choices.
- [ ] Offer session durations: 20 min, 30 min, 45 min, 60 min, 90 min, 2 hours, 3 hours.

## Permissions — first-run access model
- [ ] Build a clear first-run Permissions experience explaining why each access is useful to MYPA before OS prompts appear.
- [ ] Location → local food/context recommendations and country/region detection.
- [ ] Microphone → voice conversations with MYPA.
- [ ] Camera → movement/form coaching when the user chooses to use it.
- [ ] Notifications → reminders, food plans, workouts, habits, and scheduled actions.
- [ ] Photos/media only when a later feature genuinely needs it.
- [ ] Handle Allow / Deny / Re-request states cleanly without locking the user out of onboarding.
- [ ] Keep permission behavior local-development friendly and ready for later Supabase migration.

## Shared visual direction — all onboarding screens
- [ ] Create a cohesive premium visual composition shared by all screens rather than a collection of plain forms.
- [ ] Use a MYPA-aligned background treatment with subtle depth (for example soft gradients, glow/aura, layered surfaces, or restrained ambient shapes) instead of flat white emptiness.
- [ ] Use stronger card hierarchy, spacing, shadows, and selected states so options feel tactile and intentional.
- [ ] Use small meaningful visual cues/icons where they improve comprehension, without turning the screen into clutter.
- [ ] Maintain a consistent visual rhythm across the onboarding flow: centered brand → question → supporting copy → options → primary action.
- [ ] Make the design feel friendly and alive, but not childish or overloaded with effects.
- [ ] Ensure the design works equally well in Persian RTL and English LTR.
- [ ] Keep mixed-language labels such as `MYPA` and `My Personal Assistant` visually stable and correctly ordered.

## Branding
- [x] Correct Persian word order around MYPA.
- [ ] Revisit the top wordmark placement so `My Personal Assistant` is visually centered in the true screen axis.
- [x] Replace the overly dark/plain logo treatment with a more premium, lively MYPA mark.
- [ ] Audit all screens for consistent use of the same brand mark, typography, colors, corner radii, shadows, and spacing.

## Final visual pass
- [ ] Compare every onboarding screen side-by-side for consistency.
- [ ] Verify RTL layout and typography at realistic Android sizes.
- [ ] Test short screens, long text, and keyboard/scroll interactions.
- [ ] Test first-launch permission behavior for location and graceful denial/fallback.
- [ ] Build and verify on the connected Android phone.
- [ ] Verify voice assistant on the connected Android phone as a blocking acceptance criterion.
- [ ] Only after this visual pass is stable, continue with the next product task.
