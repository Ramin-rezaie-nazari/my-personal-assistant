# C — Visual & Onboarding UX Roadmap

Goal: make the first-use experience feel polished, lively, coherent, personal, and unmistakably MYPA before adding more product surface area.

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

## Screen 1 — goals
- [x] Rewrite the question to explicitly ask: `هدفت از تمرینات ورزشی و برنامه غذایی چیه؟`
- [x] Replace the weak helper copy with: `با جواب دادن به این سؤال‌ها بهتر می‌تونم کمکت کنم تا به هدفت برسی.`
- [x] Make option 1 `کاهش چربی و کاهش وزن`.
- [x] Keep option 2 as `خوش‌فرم شدن` but review wording/visual emphasis so it reads naturally for both nutrition and exercise.
- [x] Make option 3 muscle-focused: `عضله‌سازی و قدرت بیشتر` (or equivalent concise wording).
- [ ] Add a fourth option that is clearly understandable as a general health/fitness goal, not an ambiguous catch-all.
- [ ] Review whether this screen should support one primary goal only or a primary + secondary goal, based on future recommendation logic.

## Screen 2 — fitness level
- [x] Rewrite the question to: `چه سطحی از تمرینات ورزشی برای شما مناسبه؟`
- [ ] Review option labels so a first-time user immediately understands what each level means.
- [ ] Consider adding tiny supporting descriptions/examples to reduce ambiguity.

## Screen 3 — food preferences
- [x] Rewrite the question to: `دوست داری برنامه غذاییت چجوری باشه؟`
- [x] Rewrite helper copy to: `از این به بعد بهتر می‌تونم غذاهایی رو بهت معرفی کنم که بیشتر خوشت بیاد.`
- [ ] Re-check all food options for clarity and whether they feel relevant to meal recommendations rather than exercise.
- [ ] Separate dietary style/restrictions from general food preferences later if recommendation quality benefits from it.
- [ ] Ensure `خوش‌فرم شدن` is treated as a cross-domain goal where appropriate, not an exercise-only concept.

## Screen 4 — context
- [ ] Review the purpose of the country/cuisine question and make the wording immediately understandable.
- [ ] Make the connection to recommendations explicit without sounding technical.

## Screen 5 — exercise setup
- [ ] Ensure this screen is clearly and exclusively about exercise setup, equipment, and available session time.
- [ ] Review whether the current split between equipment and duration is the cleanest UX.

## Branding
- [x] Correct Persian word order around MYPA.
- [ ] Revisit the top wordmark placement so `My Personal Assistant` is visually centered in the true screen axis.
- [x] Replace the overly dark/plain logo treatment with a more premium, lively MYPA mark.
- [ ] Audit all screens for consistent use of the same brand mark, typography, colors, corner radii, shadows, and spacing.

## Final visual pass
- [ ] Compare every onboarding screen side-by-side for consistency.
- [ ] Verify RTL layout and typography at realistic Android sizes.
- [ ] Test short screens, long text, and keyboard/scroll interactions.
- [ ] Build and verify on the connected Android phone.
- [ ] Only after this visual pass is stable, continue with the next product task.
