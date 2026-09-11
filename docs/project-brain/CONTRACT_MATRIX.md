# Contract Matrix

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main Core, complete Brain file-level scope, complete enumerated Food/Recipe/Nutrition/Meals/Recommendation/Budget backend contracts.
Scope not yet read: Shopping, Life/Health, Fitness outside Brain integrations, Platform/Tests, Mobile consumers, repository-wide route/DB/transaction mapping.
Evidence roots: backend controllers/services/DTOs/modules; Project Brain deep-reads; Prisma schema/migrations.
Confidence level: HIGH for listed backend file-level contracts; MEDIUM for end-to-end consumer/persistence correctness until mobile, DB readers/writers and runtime tests are complete.
Open questions: global prefixes/middleware, exact deployed DB drift, mobile consumers, transaction boundaries for all routes.

| Contract | Input | Output/Effect | Auth | Persistence | Consumer |
|---|---|---|---|---|---|
| `/auth/register` | RegisterDto | token pair + user summary | public | User + Session | mobile not yet read |
| `/auth/login` | LoginDto | token pair + user summary | public | Session create | mobile not yet read |
| `/auth/me` | bearer JWT | request user | JWT | User lookup | mobile not yet read |
| `/auth/refresh` | RefreshTokenDto | new token pair/session | service refresh validation | Session lookup/create | mobile not yet read |
| `/auth/logout` | LogoutDto | success | controller unguarded; service token validation | Session deleteMany | mobile not yet read |
| `/users/profile` GET/PATCH | JWT + UpdateProfileDto | profile summary | JWT | User read/update | mobile not yet read |
| `/profile` GET/PATCH | JWT + UpdateProfileDto | UserProfile row | JWT | UserProfile read/upsert | mobile not yet read |
| `/preferences` GET/PATCH | JWT + UpdatePreferencesDto | UserPreference row | JWT | read/create/upsert | mobile not yet read |
| `/onboarding/status` GET | JWT | onboarding row | JWT | read/create | mobile not yet read |
| `/onboarding/complete` POST | JWT + CompleteOnboardingDto | onboarding row | JWT | update | mobile not yet read |
| `/settings` GET/PATCH | JWT + UpdateSettingsDto | settings row | JWT | read/create/upsert | mobile not yet read |
| `/device-intelligence` GET | none | placeholder health | no controller guard | none observed | mobile not yet read |
| `/user-intelligence` GET | JWT | facts/insights/adaptive profile | JWT | UserFact/UserInsight/UserBehavior reads | mobile not yet read |
| `/user-intelligence/events` POST | JWT + body | adaptive event/profile | JWT | UserBehavior create | mobile not yet read |
| `/user-intelligence/analyze` POST | JWT | refreshed intelligence profile | JWT | UserInsight writes | mobile not yet read |
| `/assistant` GET | none | public status | public | none | mobile not yet read |
| `/assistant/history` GET | JWT | recent ConversationTurn rows | JWT | raw SQL `ConversationTurn` | mobile not yet read |
| `/assistant` POST | assistant request DTO | assistant response/action execution | JWT | ConversationTurn + downstream domain writes | mobile not yet read |
| `/assistant/confirm` POST | confirmation payload | execution receipt | JWT | downstream action + execution/audit state | mobile not yet read |
| `/foods` GET | search query | user/global FoodItem list | JWT | read FoodItem | mobile not yet read |
| `/foods` POST | CreateFoodDto | created FoodItem | JWT | FoodItem create (user-owned) | mobile not yet read |
| `/recipes` POST | CreateRecipeDto | Recipe | JWT | Recipe + RecipeIngredient transaction | mobile not yet read |
| `/recipes` GET | optional query | user/global recipes, country rank | JWT | Recipe reads | mobile not yet read |
| `/recipes/local` GET | countryCode | local recipe guidance | JWT | static data only | mobile not yet read |
| `/recipes/countries` GET | none | supported country codes | JWT | static data | mobile not yet read |
| `/recipes/match` GET | recipeId/servings | inventory match | JWT | Recipe + Inventory reads | mobile not yet read |
| `/recipes/recommendations` GET | servings/country/calorie/protein filters | ranked recipe recommendations | JWT | Recipe/Inventory/NutritionProfile reads | mobile not yet read |
| `/recipes/meal-plan` GET | servings/country | 3-meal deterministic plan | JWT | Recipe/Inventory/NutritionProfile via FoodOperatingLoop | mobile not yet read |
| `/recipes/:id/food-plan` GET | servings/country | scaled recipe + inventory/finance context | JWT | Recipe + Inventory + static finance | mobile not yet read |
| `/recipes/:id/food-plan/shopping` POST | servings | adds recipe-missing items | JWT | ShoppingItem writes via ShoppingService | mobile not yet read |
| `/recipes/:id/scaled` GET | servings | scaled recipe | JWT | Recipe read | mobile not yet read |
| `/recipes/:id` GET/PATCH/DELETE | recipeId + patch | recipe read/update/delete | JWT | owner-scoped Recipe transaction | mobile not yet read |
| `/nutrition` GET | dateKey? | NutritionLog list | JWT | NutritionLog read | mobile not yet read |
| `/nutrition/summary` GET | dateKey? | goal-aware daily summary | JWT | NutritionLog + NutritionProfile + DailyLog reads | mobile not yet read |
| `/nutrition` POST | CreateNutritionDto | NutritionLog + DailyLog aggregate | JWT | transaction | mobile not yet read |
| `/meals` GET | none | user meals/items/foods | JWT | Meal reads | mobile not yet read |
| `/meals` POST | CreateMealDto | Meal + MealItem + DailyLog | JWT | transaction | mobile not yet read |
| `/recommendation-intelligence` | none | empty controller | none | none | mobile not yet read |
| `/budget-intelligence` GET | none | placeholder budget plan | public | none | mobile not yet read |
| `/budget-intelligence/meal-plan` GET | JWT + servings/country | deterministic 3-meal nutrition plan | JWT | Recipe + NutritionProfile reads | mobile not yet read |
| `/budget-intelligence/country` GET | countryCode | currency/finance context | public | static data | mobile not yet read |
| `/budget-intelligence/countries` GET | none | 195 country codes | public | static data | mobile not yet read |

The matrix records backend contracts only; Mobile/consumer fields remain explicitly unresolved until the Mobile deep-read is complete.
