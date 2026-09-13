# Contract Matrix

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main Core, complete Brain file-level scope, complete enumerated Food/Recipe/Nutrition/Meals/Recommendation/Budget backend contracts; substantial Shopping/Life/Health/Fitness; substantial Mobile API and screen consumers; backend common/config/auth/fitness cross-contracts; selected operational scripts and historical PRs; current-main direct revalidation of mobile route aliases and recipe-intelligence scripts.
Scope not yet read: exhaustive repository-wide route↔DTO↔test↔mobile mapping, complete database readers/writers/transactions, runtime HTTP validation, physical-device validation, remaining source/legacy scripts.
Evidence roots: backend controllers/services/DTOs/modules; mobile `app/` and `lib/`; Project Brain deep-reads; Prisma schema/migrations; CI workflows.
Confidence level: HIGH for directly read source contracts and confirmed consumers; MEDIUM for end-to-end correctness until runtime tests and exhaustive mappings are closed.
Open questions: global prefixes/middleware, deployed DB drift, remaining mobile consumers, transaction boundaries for all routes, runtime error payload parity.

| Contract | Input | Output/Effect | Auth | Persistence | Consumer |
|---|---|---|---|---|---|
| `/auth/register` | RegisterDto | token pair + user summary | public | User + Session | Mobile auth flow via `register()` |
| `/auth/login` | LoginDto | token pair + user summary | public | Session create | Mobile auth flow via `login()` |
| `/auth/me` | bearer JWT | request user | JWT | User lookup | Mobile API `getMe()` |
| `/auth/refresh` | RefreshTokenDto | new token pair/session | public controller; service validates refresh token | Session lookup/create | Mobile API automatic refresh |
| `/auth/logout` | LogoutDto | success | public controller | Session revoke/delete | Mobile API `logout()` |
| `/users/profile` GET/PATCH | JWT + UpdateProfileDto | profile summary | JWT | User read/update | Mobile profile routes/API helpers |
| `/profile` GET/PATCH | JWT + UpdateProfileDto | UserProfile row | JWT | UserProfile read/upsert | Mobile profile/onboarding consumers |
| `/preferences` GET/PATCH | JWT + UpdatePreferencesDto | UserPreference row | JWT | UserPreference read/create/upsert | Mobile preference/settings consumers |
| `/onboarding/status` GET | JWT | onboarding row | JWT | read/create | Mobile onboarding flow |
| `/onboarding/complete` POST | JWT + CompleteOnboardingDto | onboarding row | JWT | update | Mobile onboarding flow |
| `/settings` GET/PATCH | JWT + UpdateSettingsDto | settings row | JWT | read/create/upsert | Mobile global settings flow |
| `/device-intelligence` GET | none | placeholder health | no controller guard | none observed | Source-level endpoint; PB-170/139 |
| `/user-intelligence` GET | JWT | facts/insights/adaptive profile | JWT | UserFact/UserInsight/UserBehavior reads | Mobile insights path uses `getPersonalInsights()` via adaptive-learning, not this route directly |
| `/user-intelligence/events` POST | JWT + body | adaptive event/profile | JWT | UserBehavior create | Consumer mapping still open |
| `/user-intelligence/analyze` POST | JWT | refreshed intelligence profile | JWT | UserInsight writes | Consumer mapping still open |
| `/assistant` GET | none | public status | public | none | Source/API contract; direct mobile consumer not confirmed in this pass |
| `/assistant/history` GET | JWT | recent ConversationTurn rows | JWT | raw SQL `ConversationTurn` | Mobile assistant/history contract remains open |
| `/assistant` POST | assistant request DTO | assistant response/action execution | JWT | ConversationTurn + downstream domain writes | Mobile assistant flow |
| `/assistant/confirm` POST | confirmation payload | execution receipt | JWT | downstream action + execution/audit state | Mobile assistant/action confirmation |
| `/foods` GET | search query | user/global FoodItem list | JWT | read FoodItem | Mobile `smart-meals.tsx`, `meal-builder.tsx` via `getFoods()` |
| `/foods` POST | CreateFoodDto | created FoodItem | JWT | FoodItem create | Mobile meal/food builder helper |
| `/recipes` POST | CreateRecipeDto | Recipe | JWT | Recipe + RecipeIngredient transaction | Mobile recipe consumers, exact screen mapping still open |
| `/recipes` GET | optional query | user/global recipes, country rank | JWT | Recipe reads | Mobile recipe helpers/route consumers partially read |
| `/recipes/local` GET | countryCode | local recipe guidance | JWT | static data only | Mobile recipe/country flow remains to reconcile |
| `/recipes/countries` GET | none | supported country codes | JWT | static data | Mobile globalization flow partially mapped |
| `/recipes/match` GET | recipeId/servings | inventory match | JWT | Recipe + Inventory reads | Mobile recipe planning consumer remains to reconcile |
| `/recipes/recommendations` GET | servings/country/calorie/protein filters | ranked recipe recommendations | JWT | Recipe/Inventory/NutritionProfile reads | Mobile Smart Meals/recommendation flow partially mapped |
| `/recipes/meal-plan` GET | servings/country | 3-meal deterministic plan | JWT | Recipe/Inventory/NutritionProfile | Consumer mapping partially read |
| `/recipes/:id/food-plan` GET | servings/country | scaled recipe + inventory/finance context | JWT | Recipe + Inventory + static finance | Mobile recipe planning consumer remains to reconcile |
| `/recipes/:id/food-plan/shopping` POST | servings | adds recipe-missing items | JWT | ShoppingItem writes via ShoppingService | Mobile shopping handoff partially mapped |
| `/recipes/:id/scaled` GET | servings | scaled recipe | JWT | Recipe read | Mobile serving/scaling UI remains to reconcile |
| `/recipes/:id` GET/PATCH/DELETE | recipeId + patch | recipe read/update/delete | JWT | owner-scoped Recipe transaction | Mobile recipe detail/edit/delete consumers partially read |
| `/nutrition` GET | dateKey? | NutritionLog list | JWT | NutritionLog read | Mobile nutrition/meals consumers |
| `/nutrition/summary` GET | dateKey? | goal-aware daily summary | JWT | NutritionLog + NutritionProfile + DailyLog reads | Mobile `meals.tsx`, `smart-meals.tsx`, `command-center-v2.tsx` via `getNutritionSummary()` |
| `/nutrition` POST | CreateNutritionDto | NutritionLog + DailyLog aggregate | JWT | transaction | Mobile nutrition logging flow |
| `/meals` GET | none | user meals/items/foods | JWT | Meal reads | Mobile `meals.tsx`, `meal/[id].tsx` via `getMeals()` |
| `/meals` POST | CreateMealDto | Meal + MealItem + DailyLog | JWT | transaction | Mobile meal builder |
| `/recommendation-intelligence` | none | empty controller | none | none | Dedicated module/controller remains unwired/empty (PB-161/PB-162) |
| `/budget-intelligence` GET | none | placeholder budget plan | public | none | Direct mobile consumer not yet confirmed |
| `/budget-intelligence/meal-plan` GET | JWT + servings/country | deterministic 3-meal nutrition plan | JWT | Recipe + NutritionProfile reads | Consumer mapping remains open |
| `/budget-intelligence/country` GET | countryCode | currency/finance context | public | static data | Global settings/price flow partially mapped |
| `/budget-intelligence/countries` GET | none | 195 country codes | public | static data | Global settings/price flow partially mapped |
| `/calendar` GET | from/to | calendar event list | JWT | CalendarEvent reads | Mobile `calendar.tsx` and `calendar-api.ts` via `getCalendarEvents()` |
| `/calendar` POST | create event DTO | CalendarEvent | JWT | CalendarEvent write | Mobile calendar flow |
| `/reminders` GET | includeCompleted | reminder list | JWT | Reminder reads | Mobile `reminders.tsx` via `getReminders()` |
| `/reminders` POST/PATCH/complete/reopen/delete/next | reminder mutation | reminder state | JWT | Reminder writes | Mobile reminders flow |
| `/notifications` GET | includeRead | notification list | JWT | Notification reads | Mobile `notifications.tsx` via `getNotifications()` |
| `/notifications` POST/read/read-all/generate | notification mutation/intelligence | notification state | JWT | Notification writes | Mobile notification inbox/preferences flow |
| `/habits` GET/POST/PATCH/DELETE/complete | habit contracts | habit state/logs | JWT | Habit/HabitLog writes | Mobile `habits.tsx` via `getHabits()`/mutations |
| `/supplements` GET/POST/PATCH/DELETE/take/today | supplement contracts | supplement state/status | JWT | Supplement/SupplementLog writes | Mobile supplements flow via API helpers |
| `/dashboard/today` and `/dashboard/overview` | dateKey? | daily/weekly dashboard | JWT | multiple user-domain reads | Mobile command-center/dashboard helpers; exact consumer for overview helper still open |
| `/adaptive-learning/insights` GET | dateKey? | PersonalInsightsResponse | JWT | UserInsight reads | Mobile `insights.tsx` via `getPersonalInsights()` |
| `/personal-brain/trace` GET | none | decision trace | JWT | DecisionAuditEntry read | Mobile `command-center-v2.tsx` via `getDecisionTrace()` |
| `/personal-brain/plan/history` GET | limit | plan execution history | JWT | PlanExecutionState read | Mobile `command-center-v2.tsx` via `getPlanHistory()` |

## Mobile route alias / entrypoint reconciliation

- `apps/mobile/app/index.tsx` is a pure route alias that re-exports `./command-center`.
- `apps/mobile/app/command-center.tsx` is a pure alias that re-exports `./command-center-v2`.
- Therefore the effective root route implementation is `command-center-v2.tsx`; `index.tsx` and `command-center.tsx` are not separate feature implementations and should not be counted as duplicate runtime screens.
- This alias chain was directly revalidated against audited main and introduces no new finding.

## Confirmed mobile-consumer evidence

Direct repository searches confirm the following active consumers:

- `apps/mobile/app/meals.tsx` and `apps/mobile/app/meal/[id].tsx` call `getMeals()`; `meals.tsx` also calls `getNutritionSummary()`.
- `apps/mobile/app/smart-meals.tsx` calls `getNutritionSummary()` and `getFoods()` and reads inventory in the same load path.
- `apps/mobile/app/meal-builder.tsx` calls `getFoods()` for food search/building.
- `apps/mobile/app/calendar.tsx` calls `getCalendarEvents()` and builds the date range sent to the API.
- `apps/mobile/app/reminders.tsx` calls `getReminders()`; backend service/controller expose the corresponding authenticated list contract.
- `apps/mobile/app/notifications.tsx` calls `getNotifications()`; backend controller/service expose the corresponding authenticated list contract.
- `apps/mobile/app/habits.tsx` calls `getHabits()` and `getHabitSummary()`; backend `HabitsController` and `HabitsService` expose matching list/summary contracts.
- `apps/mobile/app/insights.tsx` calls `getPersonalInsights()` against the adaptive-learning endpoint.
- `apps/mobile/app/command-center-v2.tsx` calls `getDailyCommandCenter()`, `getPlanHistory(1)`, `getDecisionTrace()`, and `getNutritionSummary()`.

## Validation-contract corrections

Inline `@Body()` object/interface types are not treated as equivalent to class DTOs for the global Nest ValidationPipe whitelist analysis. PB-232 and PB-237 therefore do not retain their earlier claim of a guaranteed whitelist runtime collision; PB-234 is narrowed to the concrete class DTO (`CreateCalendarEventDto`) unless independent runtime evidence establishes another defect. PB-243 remains a grouped active-class-DTO validation finding pending historical overlap reconciliation with PB-077/PB-083/PB-085/PB-089/PB-093.

The matrix remains intentionally incomplete until every backend route has a direct DTO/error/test/mobile consumer mapping and runtime validation. No endpoint is marked green solely from matching names.
