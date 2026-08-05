import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { DailyModule } from './modules/daily/daily.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { FoodsModule } from './modules/foods/foods.module';
import { MealsModule } from './modules/meals/meals.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { SupplementsModule } from './modules/supplements/supplements.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HabitsModule } from './modules/habits/habits.module';
import { ConfigModule } from './common/config/config.module';
import { PrismaModule } from './common/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ProfileModule } from './modules/profile/profile.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { UserIntelligenceModule } from './modules/user-intelligence/user-intelligence.module';
import { PreferencesModule } from './modules/preferences/preferences.module';

@Module({
  imports: [
    HealthModule,
    DailyModule,
    NutritionModule,
    FoodsModule,
    MealsModule,
    RecipesModule,
    WorkoutModule,
    SupplementsModule,
    RemindersModule,
    CalendarModule,
    NotificationsModule,
    HabitsModule,
    ConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    ProfileModule,
    OnboardingModule,
    AssistantModule,
    UserIntelligenceModule,
    PreferencesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
