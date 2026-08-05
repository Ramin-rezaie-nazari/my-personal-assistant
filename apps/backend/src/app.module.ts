import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { DailyModule } from './modules/daily/daily.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { FoodsModule } from './modules/foods/foods.module';
import { MealsModule } from './modules/meals/meals.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { ConfigModule } from './common/config/config.module';
import { PrismaModule } from './common/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ProfileModule } from './modules/profile/profile.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { PreferencesModule } from './modules/preferences/preferences.module';

@Module({
  imports: [
    HealthModule,
    DailyModule,
    NutritionModule,
    FoodsModule,
    MealsModule,
    RecipesModule,
    ConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    ProfileModule,
    OnboardingModule,
    AssistantModule,
    PreferencesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
