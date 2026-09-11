# Database Schema

Last updated: 2026-09-11
Review status: READ_PARTIALLY
Scope actually read: beginning and large middle portion of `apps/backend/prisma/schema.prisma` from the active branch.
Scope not yet read: schema tail, every migration, all readers/writers, seed/import contracts, indexes/constraints across all models.
Evidence roots: apps/backend/prisma/schema.prisma.
Confidence level: MEDIUM for core identity/recipe/food/inventory/shopping structures; LOW for unreviewed tail/migrations.
Open questions: schema-to-migration drift, duplicate historical models, runtime DB state, transaction boundaries.

## Models observed in the reviewed schema portion

Identity: `User`, `AuthAccount`, `Session`, `UserSettings`, `UserPreference`, `UserProfile`, `UserOnboarding`, `AssistantProfile`, `HealthProfile`, `NutritionProfile`.

Daily/nutrition: `DailyLog`, `NutritionLog`, `Meal`, `MealItem`.

Food/recipe: `IngredientCanonical`, `IngredientCanonicalAlias`, `RegionCanonical`, `CuisineCanonical`, `RecipeSafetyAssertion`, `FoodItem`, `RecipeIngredient`, `Recipe`, `RecipeStep`, `RecipeMedia`, `RecipeCuisine`, `RecipeRegion`.

Household: `InventoryItem`, `ShoppingItem`.

Lifestyle: `Workout`, `Reminder`, `Habit`, `HabitLog`.

The `User` model has relationships spanning auth, profile/preferences/onboarding, nutrition/food/meals/recipes, inventory/shopping, workouts/reminders/habits, supplements/notifications, user intelligence, plan execution and decision audit. This indicates a centralized user-scoped persistence model with multiple bounded domains.

## Important verified constraints in reviewed portion

- `User.email` is unique.
- `AuthAccount(provider, providerAccountId)` is unique.
- `UserSettings.userId`, `UserPreference.userId`, `UserProfile.userId`, `UserOnboarding.userId`, `AssistantProfile.userId`, `HealthProfile.userId`, and `NutritionProfile.userId` are unique.
- `DailyLog(userId,dateKey)` is unique.
- `RecipeStep(recipeId,stepNumber)` is unique.
- `RecipeMedia(recipeId,position)` is unique.
- `InventoryItem(userId,foodId)` is unique.
- `HabitLog(habitId,dateKey)` is unique.
- Multiple relations use cascade deletion from parent user/recipe/meal/habit entities.

No migration drift claim is made until every migration is reconciled against the complete schema.
