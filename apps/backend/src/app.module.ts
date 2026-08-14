import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { DailyModule } from './modules/daily/daily.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { FoodsModule } from './modules/foods/foods.module';
import { MealsModule } from './modules/meals/meals.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ShoppingModule } from './modules/shopping/shopping.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { SupplementsModule } from './modules/supplements/supplements.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HabitsModule } from './modules/habits/habits.module';
import { GoalsModule } from './modules/goals/goals.module';
import { LifeExecutionModule } from './modules/life-execution/life-execution.module';
import { ConfigModule } from './common/config/config.module';
import { PrismaModule } from './common/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ProfileModule } from './modules/profile/profile.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { UserIntelligenceModule } from './modules/user-intelligence/user-intelligence.module';
import { BudgetIntelligenceModule } from './modules/budget-intelligence/budget-intelligence.module';
import { PriceIntelligenceModule } from './modules/price-intelligence/price-intelligence.module';
import { ShoppingIntelligenceModule } from './modules/shopping-intelligence/shopping-intelligence.module';
import { DeviceIntelligenceModule } from './modules/device-intelligence/device-intelligence.module';
import { DecisionEngineModule } from './modules/decision-engine/decision-engine.module';
import { AdaptiveLearningModule } from './modules/adaptive-learning/adaptive-learning.module';
import { ContextEngineModule } from './modules/context-engine/context-engine.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { PersonalBrainModule } from './modules/personal-brain/personal-brain.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DailyCommandCenterModule } from './modules/daily-command-center/daily-command-center.module';
import { YogaModule } from './modules/yoga/yoga.module';
import { CalisthenicsModule } from './modules/calisthenics/calisthenics.module';
import { FitnessModule } from './modules/fitness/fitness.module';

@Module({
  imports: [
    HealthModule, DailyModule, NutritionModule, FoodsModule, MealsModule, RecipesModule, InventoryModule, ShoppingModule, WorkoutModule,
    SupplementsModule, RemindersModule, CalendarModule, NotificationsModule, HabitsModule, GoalsModule, LifeExecutionModule,
    ConfigModule, PrismaModule, AuthModule, UsersModule, SettingsModule, ProfileModule, OnboardingModule,
    AssistantModule, UserIntelligenceModule, BudgetIntelligenceModule, PriceIntelligenceModule,
    ShoppingIntelligenceModule, DeviceIntelligenceModule, DecisionEngineModule, AdaptiveLearningModule,
    ContextEngineModule, PreferencesModule, PersonalBrainModule, DashboardModule, DailyCommandCenterModule, YogaModule,
    CalisthenicsModule, FitnessModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
