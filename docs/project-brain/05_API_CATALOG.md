# API Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: exhaustive controller inventory at the audited `main` commit for active AppModule modules plus source-only controller shells; controller-to-service wiring inspected for Auth, Assistant, Brain Integration, Recommendation Intelligence, Goals, Life Execution, Foods, Meals, Recipes, Nutrition, Daily, Inventory, Shopping, Shopping Intelligence, Budget Intelligence, Price Intelligence, Calendar, Habits, Reminders, Notifications, Supplements, Health, Workout, Fitness, Yoga, Calisthenics, User Intelligence, Decision Engine, Adaptive Learning, Context Engine, Device Intelligence, Dashboard, Daily Command Center and Personal Brain.
Scope not yet closed: route-by-route DTO/output/error/test/mobile-consumer reconciliation; runtime HTTP verification; final duplicate/legacy controller reconciliation.
Evidence roots: `apps/backend/src/app.module.ts`; `apps/backend/src/modules/**/controllers/`; selected services/DTOs/tests; `apps/mobile/lib/**`; `apps/mobile/app/**`.
Confidence level: HIGH for controller route/path/guard inventory in the read snapshot; MEDIUM for cross-layer consumer/response contracts; no runtime verification claim.
Open questions: exact mobile consumer per route, response/error contracts not captured by shared DTOs, historical/legacy consumer overlap, live deployment prefix/gateway behavior.

## Route inventory

### Authentication / identity
| Method | Path | Guard | Controller -> service |
|---|---|---|---|
| POST | `/auth/register` | Public | AuthController -> AuthService.register |
| POST | `/auth/login` | Public | AuthController -> AuthService.login |
| GET | `/auth/me` | JWT | AuthController -> request user |
| POST | `/auth/refresh` | Public controller; token/session checked in service | AuthController -> AuthService.refreshToken |
| POST | `/auth/logout` | Public controller; refresh session revoked in service | AuthController -> AuthService.logout |
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
| GET | `/personal-brain` | Public | PersonalBrainController -> static status |
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
| `/context-engine` | none | No route methods | Empty ContextEngineController |
| `/brain-integration` | none | No route methods | Empty BrainIntegrationController |
| `/recommendation-intelligence` | none | No route methods | Empty RecommendationIntelligenceController |
| `/goal-intelligence` | none | No route methods | Empty GoalIntelligenceController |

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
| GET | `/recipes/meal-plan` | JWT | RecipesController -> FoodOperatingLoopService.recommend + deterministic meal assignment |
| GET | `/recipes/:id/food-plan` | JWT | RecipesController -> FoodOperatingLoopService.buildPlan |
| POST | `/recipes/:id/food-plan/shopping` | JWT | RecipesController -> FoodOperatingLoopService.addMissingToShopping |
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
| GET | `/shopping-intelligence` | No guard | ShoppingIntelligenceController -> ShoppingIntelligenceService.createShoppingPlan |
| GET | `/budget-intelligence` | No guard | BudgetIntelligenceController -> BudgetIntelligenceService.createPlan |
| GET | `/budget-intelligence/meal-plan` | JWT | BudgetIntelligenceController -> MealPlanningService.createMealPlan |
| GET | `/budget-intelligence/country` | No guard | BudgetIntelligenceController -> GlobalCountryFinanceService.getFinanceContext |
| GET | `/budget-intelligence/countries` | No guard | BudgetIntelligenceController -> GlobalCountryFinanceService.getSupportedCountryCodes |
| GET | `/price-intelligence` | No guard | PriceIntelligenceController -> PriceIntelligenceService.getLatestPrices |
| GET | `/price-intelligence/sources` | No guard | PriceIntelligenceController -> PricePersistenceService.sources |
| GET | `/price-intelligence/schedule` | No guard | PriceIntelligenceController -> PriceCollectionSchedulerService.schedule |
| GET | `/price-intelligence/products/:productKey/history` | No guard | PriceIntelligenceController -> PriceIntelligenceService.getHistory |
| GET | `/price-intelligence/products/:productKey/analysis` | No guard | PriceIntelligenceController -> PriceIntelligenceService.analyze |
| POST | `/price-intelligence/match` | No guard | PriceIntelligenceController -> PriceIntelligenceService.matchProduct |
| POST | `/price-intelligence/nightly/run` | No guard | PriceIntelligenceController -> PriceCollectionSchedulerService.collect |
| POST | `/price-intelligence/nightly/preview` | No guard | PriceIntelligenceController -> PriceCollectionSchedulerService.shouldRun |
| GET | `/price-intelligence/registry` | No guard | PriceIntelligenceController -> PriceSourceRegistryService.list |

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
| POST | `/life/tasks` | JWT | LifeExecutionController -> LifeExecutionService.create |
| GET | `/life/tasks` | JWT | LifeExecutionController -> LifeExecutionService.list |
| GET | `/life/tasks/next-best` | JWT | LifeExecutionController -> LifeExecutionService.nextBest |
| GET | `/life/tasks/:id` | JWT | LifeExecutionController -> LifeExecutionService.one |
| PATCH | `/life/tasks/:id` | JWT | LifeExecutionController -> LifeExecutionService.update |
| POST | `/life/tasks/:id/events` | JWT | LifeExecutionController -> LifeExecutionService.recordEvent |
| POST | `/life/tasks/:id/dependencies` | JWT | LifeExecutionController -> LifeExecutionService.addDependency |
| GET | `/tasks` | Inactive/source-only | LifeTasksController exists but LifeTasksModule is not in AppModule |
| GET/other | `/health` | Public legacy | Legacy root HealthController; active profile contract is `/health/*` below |
| GET | `/health/profile` | JWT | HealthController -> HealthService.getProfile |
| PATCH | `/health/profile` | JWT | HealthController -> HealthService.updateProfile |
| GET | `/health/nutrition` | JWT | HealthController -> NutritionService.getProfile |
| PATCH | `/health/nutrition` | JWT | HealthController -> NutritionService.updateProfile |
| GET | `/dashboard/today` | JWT | DashboardController -> DashboardService.getToday |
| GET | `/dashboard/overview` | JWT | DashboardController -> DashboardService.getOverview |
| GET | `/daily-command-center` | JWT | DailyCommandCenterController -> DailyCommandCenterService.getToday |
| GET | `/device-intelligence` | No guard | DeviceIntelligenceController -> DeviceIntelligenceService.getHealthData |

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
| POST | `/calisthenics/coach/tick` | JWT | CalisthenicsController -> CalisthenicsCoachService.tick |
| GET | `/yoga/poses` | JWT | YogaController -> YogaLibraryService.list |
| POST | `/yoga/session` | JWT | YogaController -> YogaSessionGeneratorService.generate |
| POST | `/yoga/coach/start` | JWT | YogaController -> YogaCoachService.start |
| POST | `/yoga/coach/tick` | JWT | YogaCoachService.tick |
| POST | `/yoga/coach/cue` | JWT | YogaCoachService.cue |
| POST | `/yoga/motion/analyze` | JWT | YogaController -> YogaMotionAnalysisService.analyze |

## Controller/runtime reconciliation

- `AppModule` imports the active domain modules listed above. It does not import `LifeTasksModule`, `RecommendationIntelligenceModule`, or `GoalIntelligenceModule`.
- `ContentModule` is active in `AppModule`, but the Content module snapshot has no HTTP controller; it should not be treated as an orphaned runtime module solely because there is no `/content` route.
- `BrainIntegrationModule` is transitively imported by `PersonalBrainModule`; its empty controller is therefore source-present but not an exposed HTTP contract.
- `ContextEngineModule` is active but its controller currently exposes no HTTP methods.
- The legacy root `HealthController` and active nested `HealthController` share the `health` route prefix in source; exact AppModule registration must be kept in the module catalog during final duplicate-controller reconciliation.

## Route contract closure status

Controller/path/guard inventory: READ_COMPLETELY at source level.
DTO validation, response schemas, error semantics, test coverage, database effects and mobile consumer mapping: IN_PROGRESS.
Runtime HTTP/build/device verification: NOT_STARTED in this audit session (no local clone/runtime environment available).
