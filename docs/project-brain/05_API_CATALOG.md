# API Catalog

Last updated: 2026-09-12
Review status: RECONCILED FOR CURRENT SOURCE ROUTES; LATEST DOCUMENTATION SYNC IN PROGRESS
Scope actually read: active backend controller inventory and current guard/path/service wiring for Auth, Users/Profile/Preferences/Onboarding/Settings, Assistant/Personal Brain/User Intelligence/Decision Engine/Adaptive Learning, Foods/Meals/Nutrition/Recipes, Inventory/Shopping/Shopping Intelligence/Budget/Price Intelligence, Daily/Habits/Calendar/Reminders/Notifications/Supplements/Goals/Life, Health/Dashboard/Command Center/Device Intelligence and Fitness/Workout/Calisthenics/Yoga. Historical controller-shell findings were cross-checked against current module registration.
Scope not yet fully verified here: deployed gateway prefixes, runtime HTTP execution outside CI, per-endpoint device behavior and full response-schema documentation.
Evidence roots: `apps/backend/src/app.module.ts`; `apps/backend/src/modules/**/controllers/`; selected DTOs/services/specs; `apps/mobile/lib/**`; `apps/mobile/app/**`.
Confidence level: HIGH for current controller path/guard/service wiring; MEDIUM for runtime gateway/consumer behavior.
Open questions: deployed base path/prefix and live device/runtime behavior.

## Route inventory

### Authentication / identity
| Method | Path | Guard | Controller -> service |
|---|---|---|---|
| POST | `/auth/register` | Public | AuthController -> AuthService.register |
| POST | `/auth/login` | Public | AuthController -> AuthService.login |
| GET | `/auth/me` | JWT | AuthController -> request user |
| POST | `/auth/refresh` | Public; refresh session validated in service | AuthController -> AuthService.refreshToken |
| POST | `/auth/logout` | Public; refresh session revoked in service | AuthController -> AuthService.logout |
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

### Assistant / Brain / intelligence
| Method | Path | Guard | Controller -> service |
|---|---|---|---|
| GET | `/assistant` | Public | AssistantController -> AssistantService.getStatus |
| GET | `/assistant/history` | JWT | AssistantController -> AssistantService.getHistory |
| POST | `/assistant` | JWT | AssistantController -> AssistantService.process |
| POST | `/assistant/confirm` | JWT | AssistantController -> AssistantService.confirm |
| GET | `/personal-brain` | Public status only | PersonalBrainController -> static status |
| GET | `/personal-brain/overview` | JWT | PersonalBrainController -> Brain/plan/coach/health services |
| GET | `/personal-brain/plan` | JWT | PersonalBrainController -> SmartPlanningService |
| GET | `/personal-brain/plan/history` | JWT | PersonalBrainController -> PersistentPlanStateService |
| GET | `/personal-brain/trace` | JWT | PersonalBrainController -> DecisionAuditService |
| GET | `/personal-brain/explanations/history` | JWT | PersonalBrainController -> DecisionExplanationMemoryService |
| GET | `/personal-brain/explanations/trend` | JWT | PersonalBrainController -> DecisionExplanationMemoryService |
| POST | `/personal-brain/decision/outcome` | JWT | PersonalBrainController -> DecisionOutcomeLearningService |
| GET | `/personal-brain/decision/outcome-profile` | JWT | PersonalBrainController -> DecisionOutcomeLearningService |
| POST | `/personal-brain/decision/execute` | JWT | PersonalBrainController -> DecisionExecutionCoordinatorService |
| POST | `/personal-brain/decision/confirm` | JWT | PersonalBrainController -> DecisionExecutionCoordinatorService |
| POST | `/personal-brain/decision/explain` | JWT | PersonalBrainController -> BrainReasoningContext/BrainDecisionPipeline |
| POST | `/personal-brain/fitness/session` | JWT | PersonalBrainController -> FitnessSessionOrchestratorService |
| POST | `/personal-brain/fitness/performance` | JWT | PersonalBrainController -> WorkoutPerformanceMemoryService |
| GET | `/personal-brain/fitness/performance` | JWT | PersonalBrainController -> WorkoutPerformanceMemoryService |
| GET | `/personal-brain/fitness/skills` | JWT | PersonalBrainController -> FitnessSkillUnlockService |
| GET | `/personal-brain/schedule/today` | JWT | PersonalBrainController -> FullDaySchedulerService |
| GET | `/personal-brain/schedule/replan` | JWT | PersonalBrainController -> DynamicReplanningService |
| GET | `/personal-brain/schedule/insights` | JWT | PersonalBrainController -> ScheduleInsightsService |
| GET | `/personal-brain/schedule/health` | JWT | PersonalBrainController -> ScheduleHealthService |
| GET | `/personal-brain/schedule/replan-decision` | JWT | PersonalBrainController -> ReplanPolicyService |
| GET | `/personal-brain/schedule/recovery` | JWT | PersonalBrainController -> ScheduleRecoveryService |
| GET | `/personal-brain/next-action` | JWT | PersonalBrainController -> NextBestActionService |
| GET | `/personal-brain/coach/next` | JWT | PersonalBrainController -> ProactiveCoachService |
| GET | `/personal-brain/coach/message` | JWT | PersonalBrainController -> CoachMessageService |
| GET | `/personal-brain/coach/events` | JWT | PersonalBrainController -> ProactiveEventEngineService |
| POST | `/personal-brain/coach/cue` | JWT | PersonalBrainController -> CoachCueEngineService |
| POST | `/personal-brain/coach/notification-decision` | JWT | PersonalBrainController -> NotificationDeduplication/Orchestrator |
| POST | `/personal-brain/coach/notification-feedback` | JWT | PersonalBrainController -> NotificationFeedbackService |
| GET | `/personal-brain/coach/notification-feedback` | JWT | PersonalBrainController -> NotificationFeedbackService |
| GET | `/personal-brain/coach/notification-signal` | JWT | PersonalBrainController -> NotificationFeedbackService |
| POST | `/personal-brain/coach/device` | JWT | PersonalBrainController -> NotificationDeviceRegistryService |
| GET | `/personal-brain/coach/devices` | JWT | PersonalBrainController -> NotificationDeviceRegistryService |
| POST | `/personal-brain/coach/device/disable` | JWT | PersonalBrainController -> NotificationDeviceRegistryService |
| POST | `/personal-brain/scenario/compare` | JWT | PersonalBrainController -> ScenarioPlanningService |
| POST | `/personal-brain` | JWT | PersonalBrainController -> BrainOrchestratorService |
| POST | `/personal-brain/decision/execute-next` | JWT | DecisionExecutionController -> DecisionExecutionCoordinatorService |
| POST | `/personal-brain/decision/confirm` | JWT | DecisionExecutionController -> DecisionExecutionCoordinatorService |
| POST | `/personal-brain/decision/feedback` | JWT | DecisionFeedbackController -> decision feedback services |
| GET | `/user-intelligence` | JWT | UserIntelligenceController -> UserIntelligenceService.getProfile |
| POST | `/user-intelligence/events` | JWT | UserIntelligenceController -> LearningService.learnFromAction |
| POST | `/user-intelligence/analyze` | JWT | UserIntelligenceController -> UserIntelligenceService.analyzeBehavior |
| GET | `/decision-engine` | JWT | DecisionEngineController -> ActionDecisionService.generate |
| GET | `/adaptive-learning` | JWT | AdaptiveLearningController -> AdaptiveLearningService.getStatus |
| GET | `/adaptive-learning/insights` | JWT | AdaptiveLearningController -> AdaptiveLearningService.getInsights |

### Retired/non-HTTP controller shells
| Path | Status |
|---|---|
| `/context-engine` | No active HTTP methods; controller shell not an exposed contract |
| `/brain-integration` | No active HTTP methods; module is transitively used by Personal Brain |
| `/recommendation-intelligence` | No active HTTP contract in current module graph |
| `/goal-intelligence` | No active HTTP contract in current module graph |
| `/tasks` | Source-only/legacy LifeTasks controller path; not an active AppModule route |

### Food / nutrition / recipe / commerce
| Method | Path | Guard | Controller -> service |
|---|---|---|---|
| GET | `/foods` | JWT | FoodsController -> FoodsService.findAll |
| POST | `/foods` | JWT | FoodsController -> FoodsService.create |
| GET | `/meals` | JWT | MealsController -> MealsService.findAll |
| POST | `/meals` | JWT | MealsController -> MealsService.create |
| GET | `/nutrition` | JWT | NutritionController -> NutritionService.getLogs |
| GET | `/nutrition/summary` | JWT | NutritionController -> NutritionService.getDailySummary |
| POST | `/nutrition` | JWT | NutritionController -> NutritionService.createLog |
| POST | `/recipes` | JWT | RecipesController -> RecipesService.createRecipe |
| GET | `/recipes` | JWT | RecipesController -> RecipesService.getRecipes + country ranking |
| GET | `/recipes/local` | JWT | RecipesController -> GlobalCountryFoodService.getLocalRecipeGuidance |
| GET | `/recipes/countries` | JWT | RecipesController -> GlobalCountryFoodService.getSupportedCountryCodes |
| GET | `/recipes/match` | JWT | RecipesController -> RecipeInventoryMatcherService.match |
| GET | `/recipes/recommendations` | JWT | RecipesController -> FoodOperatingLoopService.recommend |
| GET | `/recipes/meal-plan` | JWT | RecipesController -> deterministic meal recommendation path |
| GET | `/recipes/:id/food-plan` | JWT | RecipesController -> FoodOperatingLoopService.buildPlan |
| GET | `/recipes/:id/food-plan/budget` | JWT | RecipesController -> FoodOperatingLoopService.buildBudgetPlan |
| POST | `/recipes/:id/food-plan/shopping` | JWT | RecipesController -> FoodOperatingLoopService.addMissingToShopping |
| POST | `/recipes/:id/food-plan/budget/shopping` | JWT | RecipesController -> FoodOperatingLoopService.addBudgetQualifiedMissingToShopping |
| GET | `/recipes/:id/scaled` | JWT | RecipesController -> RecipesService.getScaledRecipe |
| GET | `/recipes/:id` | JWT | RecipesController -> RecipesService.getRecipe |
| PATCH | `/recipes/:id` | JWT | RecipesController -> RecipesService.updateRecipe |
| DELETE | `/recipes/:id` | JWT | RecipesController -> RecipesService.deleteRecipe |
| GET | `/inventory` | JWT | InventoryController -> InventoryService.list |
| POST | `/inventory` | JWT | InventoryController -> InventoryService.create |
| PATCH | `/inventory/:id` | JWT | InventoryController -> InventoryService.adjust |
| DELETE | `/inventory/:id` | JWT | InventoryController -> InventoryService.remove |
| GET | `/shopping/smart` | JWT | ShoppingController -> ShoppingService.smartList |
| GET | `/shopping/basket` | JWT | ShoppingController -> ShoppingService.listBasket |
| POST | `/shopping/basket` | JWT | ShoppingController -> ShoppingService.addToBasket |
| POST | `/shopping/from-recipe` | JWT | ShoppingController -> ShoppingService.addRecipeMissing |
| POST | `/shopping/basket/:id/complete` | JWT | ShoppingController -> ShoppingService.complete |
| GET | `/shopping-intelligence` | JWT | ShoppingIntelligenceController -> ShoppingIntelligenceService.createShoppingPlan(userId) |
| GET | `/budget-intelligence/plan` | JWT | BudgetIntelligenceController -> BudgetIntelligenceService.createPlan |
| GET | `/budget-intelligence/meal-plan` | JWT | BudgetIntelligenceController -> MealPlanningService.createMealPlan |
| GET | `/budget-intelligence/country` | JWT | BudgetIntelligenceController -> GlobalCountryFinanceService.getFinanceContext |
| GET | `/budget-intelligence/countries` | JWT | BudgetIntelligenceController -> GlobalCountryFinanceService.getSupportedCountryCodes |
| GET | `/price-intelligence` | JWT | PriceIntelligenceController -> PriceIntelligenceService.getLatestPrices |
| GET | `/price-intelligence/sources` | JWT | PriceIntelligenceController -> PricePersistenceService.sources |
| GET | `/price-intelligence/schedule` | JWT | PriceIntelligenceController -> PriceCollectionSchedulerService.schedule |
| GET | `/price-intelligence/products/:productKey/history` | JWT | PriceIntelligenceController -> PriceIntelligenceService.getHistory |
| GET | `/price-intelligence/products/:productKey/analysis` | JWT | PriceIntelligenceController -> PriceIntelligenceService.analyze |
| POST | `/price-intelligence/match` | JWT | PriceIntelligenceController -> PriceIntelligenceService.matchProduct |
| POST | `/price-intelligence/nightly/run` | JWT | PriceIntelligenceController -> PriceCollectionSchedulerService.collect |
| POST | `/price-intelligence/nightly/preview` | JWT | PriceIntelligenceController -> PriceCollectionSchedulerService.shouldRun |
| GET | `/price-intelligence/registry` | JWT | PriceIntelligenceController -> PriceSourceRegistryService.list |

### Life / health / routines
| Method | Path | Guard | Controller -> service |
|---|---|---|---|
| GET | `/daily` | JWT | DailyController -> DailyService.getDailyLog |
| PATCH | `/daily` | JWT | DailyController -> DailyService.updateDailyLog |
| POST | `/daily/water` | JWT | DailyController -> DailyService.addWater |
| GET | `/habits` | JWT | HabitsController -> HabitsService.getHabits |
| POST | `/habits` | JWT | HabitsController -> HabitsService.createHabit |
| GET | `/habits/summary` | JWT | HabitsController -> HabitsService.getWeeklySummary |
| PATCH | `/habits/:id` | JWT | HabitsController -> HabitsService.updateHabit |
| POST | `/habits/:id/complete` | JWT | HabitsController -> HabitsService.completeToday |
| DELETE | `/habits/:id` | JWT | HabitsController -> HabitsService.deleteHabit |
| POST | `/calendar` | JWT | CalendarController -> CalendarService.createEvent |
| GET | `/calendar` | JWT | CalendarController -> CalendarService.getEvents |
| PATCH | `/calendar/:id` | JWT | CalendarController -> CalendarService.updateEvent |
| POST | `/calendar/:id/complete` | JWT | CalendarController -> CalendarService.completeEvent |
| POST | `/calendar/:id/reopen` | JWT | CalendarController -> CalendarService.reopenEvent |
| DELETE | `/calendar/:id` | JWT | CalendarController -> CalendarService.deleteEvent |
| POST | `/reminders` | JWT | RemindersController -> RemindersService.createReminder |
| GET | `/reminders` | JWT | RemindersController -> RemindersService.getReminders |
| GET | `/reminders/next` | JWT | RemindersController -> RemindersService.getNextReminder |
| PATCH | `/reminders/:id` | JWT | RemindersController -> RemindersService.updateReminder |
| POST | `/reminders/:id/complete` | JWT | RemindersController -> RemindersService.completeReminder |
| POST | `/reminders/:id/reopen` | JWT | RemindersController -> RemindersService.reopenReminder |
| DELETE | `/reminders/:id` | JWT | RemindersController -> RemindersService.deleteReminder |
| POST | `/notifications` | JWT | NotificationsController -> NotificationsService.createNotification |
| POST | `/notifications/generate` | JWT | NotificationsController -> SmartNotificationService.generateForUser |
| GET | `/notifications` | JWT | NotificationsController -> NotificationsService.getNotifications |
| POST | `/notifications/read-all` | JWT | NotificationsController -> NotificationsService.markAllRead |
| POST | `/notifications/:id/read` | JWT | NotificationsController -> NotificationsService.markRead |
| POST | `/supplements` | JWT | SupplementsController -> SupplementsService.createSupplement |
| GET | `/supplements` | JWT | SupplementsController -> SupplementsService.getSupplements |
| GET | `/supplements/today` | JWT | SupplementsController -> SupplementsService.getTodayStatus |
| POST | `/supplements/:id/take` | JWT | SupplementsController -> SupplementsService.takeToday |
| PATCH | `/supplements/:id` | JWT | SupplementsController -> SupplementsService.updateSupplement |
| DELETE | `/supplements/:id` | JWT | SupplementsController -> SupplementsService.deleteSupplement |
| GET | `/goals` | JWT | GoalsController -> GoalsService.findAll |
| POST | `/goals` | JWT | GoalsController -> GoalsService.create |
| GET | `/goals/:id` | JWT | GoalsController -> GoalsService.findOne |
| PATCH | `/goals/:id` | JWT | GoalsController -> GoalsService.update |
| POST | `/goals/:id/checkin` | JWT | GoalsController -> GoalsService.checkin |
| DELETE | `/goals/:id` | JWT | GoalsController -> GoalsService.remove |
| GET | `/tasks` | Source-only/legacy | LifeTasksController not active in AppModule |
| GET | `/life/tasks` | JWT | LifeExecutionController -> LifeExecutionService.list |
| POST | `/life/tasks` | JWT | LifeExecutionController -> LifeExecutionService.create |
| GET | `/life/tasks/next-best` | JWT | LifeExecutionController -> LifeExecutionService.nextBest |
| GET | `/life/tasks/:id` | JWT | LifeExecutionController -> LifeExecutionService.one |
| PATCH | `/life/tasks/:id` | JWT | LifeExecutionController -> LifeExecutionService.update |
| POST | `/life/tasks/:id/events` | JWT | LifeExecutionController -> LifeExecutionService.recordEvent |
| POST | `/life/tasks/:id/dependencies` | JWT | LifeExecutionController -> LifeExecutionService.addDependency |
| GET | `/health/profile` | JWT | HealthController -> HealthService.getProfile |
| PATCH | `/health/profile` | JWT | HealthController -> HealthService.updateProfile |
| GET | `/health/nutrition` | JWT | HealthController -> NutritionService.getProfile |
| PATCH | `/health/nutrition` | JWT | HealthController -> NutritionService.updateProfile |
| GET | `/dashboard/today` | JWT | DashboardController -> DashboardService.getToday |
| GET | `/dashboard/overview` | JWT | DashboardController -> DashboardService.getOverview |
| GET | `/daily-command-center` | JWT | DailyCommandCenterController -> DailyCommandCenterService.getToday |
| GET | `/device-intelligence` | JWT | DeviceIntelligenceController -> DeviceIntelligenceService.getHealthData |
| GET | `/health` | Public | HealthController liveness contract |

### Fitness
| Method | Path | Guard | Controller -> service |
|---|---|---|---|
| POST | `/workout` | JWT | WorkoutController -> WorkoutService.createWorkout |
| GET | `/workout` | JWT | WorkoutController -> WorkoutService.getWorkouts |
| GET | `/workout/weekly-summary` | JWT | WorkoutController -> WorkoutService.getWeeklySummary |
| PATCH | `/workout/:id` | JWT | WorkoutController -> WorkoutService.updateWorkout |
| DELETE | `/workout/:id` | JWT | WorkoutController -> WorkoutService.deleteWorkout |
| GET | `/fitness/profile` | JWT | FitnessController -> FitnessProfileService.get |
| GET | `/fitness/context` | JWT | FitnessController -> FitnessProfileService.buildRecommendationContext |
| POST | `/fitness/profile` | JWT | FitnessController -> FitnessProfileService.save |
| POST | `/fitness/equipment` | JWT | FitnessController -> FitnessProfileService.addEquipment |
| DELETE | `/fitness/equipment/:id` | JWT | FitnessController -> FitnessProfileService.removeEquipment |
| POST | `/fitness/goal` | JWT | FitnessController -> FitnessProfileService.addGoal |
| POST | `/fitness/goal/from-text` | JWT | FitnessController -> FitnessProfileService.parseNaturalGoal |
| GET | `/calisthenics/exercises` | JWT | CalisthenicsController -> CalisthenicsLibraryService.list |
| POST | `/calisthenics/session` | JWT | CalisthenicsController -> CalisthenicsSessionGeneratorService.generate |
| POST | `/calisthenics/coach/start` | JWT | CalisthenicsController -> CalisthenicsCoachService.start |
| POST | `/calisthenics/coach/tick` | JWT | CalisthenicsCoachService.tick |
| GET | `/yoga/poses` | JWT | YogaController -> YogaLibraryService.list |
| POST | `/yoga/session` | JWT | YogaController -> YogaSessionGeneratorService.generate |
| POST | `/yoga/coach/start` | JWT | YogaController -> YogaCoachService.start |
| POST | `/yoga/coach/tick` | JWT | YogaCoachService.tick |
| POST | `/yoga/coach/cue` | JWT | YogaCoachService.cue |
| POST | `/yoga/motion/analyze` | JWT | YogaController -> YogaMotionAnalysisService.analyze |

## Controller/runtime reconciliation

- Active user/data controllers are JWT-protected unless intentionally public (`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/health` liveness, `/assistant` status, `/personal-brain` static status).
- Current Shopping, Shopping Intelligence, Budget Intelligence, Price Intelligence and Device Intelligence controllers all have explicit `JwtAuthGuard` boundaries.
- The former `No guard` values from the 2026-09-11 snapshot are superseded by current controller source and must not be used as security evidence.
- Retired/empty controller shells are documented as non-contracts rather than exposed routes.

## Route contract closure status

Controller/path/guard inventory: RECONCILED FOR CURRENT SOURCE.
DTO validation, response schemas, error semantics, test coverage, database effects and mobile consumer mapping: RECONCILED WHERE IDENTIFIED; runtime HTTP outside CI and deployed gateway behavior remain environment gates.

## Environment boundary

This catalog describes repository source and CI evidence only. It does not claim deployed base URLs, gateway rewrites, physical-device behavior, external provider availability or production authentication configuration.
