# API Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: Core route set plus current BATCH-0012 controller verification for Auth, Foods, Meals, Inventory, Shopping, Daily, Habits, Dashboard, Daily Command Center, Device Intelligence.
Scope not yet read: remaining non-Core controller files and complete route-to-service/test/mobile consumer reconciliation.
Evidence roots: controller files under `apps/backend/src/modules/**`; `apps/backend/src/app.module.ts`; bootstrap/global validation config.
Confidence level: MEDIUM for route paths and guard placement in the read scope; LOW globally until the remaining controller inventory is closed.
Open questions: remaining non-Core routes; response/error DTOs; controller-to-service contract details; mobile consumer mapping; runtime verification.

| Method | Path | Guard | Controller/service |
|---|---|---|---|
| POST | `/auth/register` | Public | AuthController -> AuthService.register |
| POST | `/auth/login` | Public | AuthController -> AuthService.login |
| GET | `/auth/me` | JWT | AuthController -> request user |
| POST | `/auth/refresh` | Controller-unprotected; refresh token checked in service | AuthController -> AuthService.refreshToken |
| POST | `/auth/logout` | Controller-unprotected | AuthController -> AuthService.logout |
| GET | `/users/profile` | JWT | UsersController -> UsersService.getProfile |
| PATCH | `/users/profile` | JWT | UsersController -> UsersService.updateProfile |
| GET | `/profile` | JWT | ProfileController -> ProfileService.getProfile |
| PATCH | `/profile` | JWT | ProfileController -> ProfileService.updateProfile |
| GET | `/preferences` | JWT | PreferencesController -> PreferencesService.getPreferences |
| PATCH | `/preferences` | JWT | PreferencesController -> PreferencesService.updatePreferences |
| GET | `/onboarding/status` | JWT | OnboardingController -> OnboardingService.getStatus |
| POST | `/onboarding/complete` | JWT | OnboardingController -> OnboardingService.complete |
| GET | `/settings` | JWT | SettingsController -> SettingsService.getSettings |
| PATCH | `/settings` | JWT | SettingsController -> SettingsService.updateSettings |
| GET | `/device-intelligence` | No controller guard | DeviceIntelligenceController -> DeviceIntelligenceService.getHealthData |
| GET | `/user-intelligence` | JWT | UserIntelligenceController -> UserIntelligenceService.getProfile |
| POST | `/user-intelligence/events` | JWT | UserIntelligenceController -> LearningService.learnFromAction |
| POST | `/user-intelligence/analyze` | JWT | UserIntelligenceController -> UserIntelligenceService.analyzeBehavior |
| GET/other | `/context-engine` | No exposed method currently | Empty ContextEngineController |
| GET | `/foods` | JWT | FoodsController -> FoodsService.findAll |
| POST | `/foods` | JWT | FoodsController -> FoodsService.create |
| GET | `/meals` | JWT | MealsController -> MealsService.findAll |
| POST | `/meals` | JWT | MealsController -> MealsService.create |
| GET | `/inventory` | JWT | InventoryController -> InventoryService.list |
| POST | `/inventory` | JWT | InventoryController -> InventoryService.create |
| PATCH | `/inventory/:id` | JWT | InventoryController -> InventoryService.adjust |
| DELETE | `/inventory/:id` | JWT | InventoryController -> InventoryService.remove |
| GET | `/shopping/smart` | JWT | ShoppingController -> ShoppingService.smartList |
| GET | `/shopping/basket` | JWT | ShoppingController -> ShoppingService.listBasket |
| POST | `/shopping/basket` | JWT | ShoppingController -> ShoppingService.addToBasket |
| POST | `/shopping/from-recipe` | JWT | ShoppingController -> ShoppingService.addRecipeMissing |
| POST | `/shopping/basket/:id/complete` | JWT | ShoppingController -> ShoppingService.complete |
| GET | `/daily` | JWT | DailyController -> DailyService.getDailyLog |
| PATCH | `/daily` | JWT | DailyController -> DailyService.updateDailyLog |
| POST | `/daily/water` | JWT | DailyController -> DailyService.addWater |
| POST | `/habits` | JWT | HabitsController -> HabitsService.createHabit |
| GET | `/habits` | JWT | HabitsController -> HabitsService.getHabits |
| GET | `/habits/summary` | JWT | HabitsController -> HabitsService.getWeeklySummary |
| PATCH | `/habits/:id` | JWT | HabitsController -> HabitsService.updateHabit |
| POST | `/habits/:id/complete` | JWT | HabitsController -> HabitsService.completeToday |
| DELETE | `/habits/:id` | JWT | HabitsController -> HabitsService.deleteHabit |
| GET | `/dashboard/today` | JWT | DashboardController -> DashboardService.getToday |
| GET | `/dashboard/overview` | JWT | DashboardController -> DashboardService.getOverview |
| GET | `/daily-command-center` | JWT | DailyCommandCenterController -> DailyCommandCenterService.getToday |
| GET | `/device-intelligence` | No controller guard | DeviceIntelligenceController -> DeviceIntelligenceService.getHealthData |

Evidence: `apps/backend/src/modules/auth/controllers/auth.controller.ts`, `foods/controllers/foods.controller.ts`, `meals/controllers/meals.controller.ts`, `inventory/inventory.controller.ts`, `shopping/shopping.controller.ts`, `daily/controllers/daily.controller.ts`, `habits/controllers/habits.controller.ts`, `dashboard/dashboard.controller.ts`, `daily-command-center/daily-command-center.controller.ts`, `device-intelligence/controllers/device-intelligence.controller.ts`, plus the earlier Core controller set.

Note: `/device-intelligence` is intentionally repeated above as a controller verification checkpoint only; final catalog reconciliation must deduplicate paths and add module/service/test/mobile consumer evidence.
