import { Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BudgetIntelligenceService } from '../services/budget-intelligence.service';
import { GlobalCountryFinanceService } from '../services/global-country-finance.service';
import { MealPlanningService } from '../services/meal-planning.service';

@Controller('budget-intelligence')
export class BudgetIntelligenceController {
  constructor(
    private readonly budgetService: BudgetIntelligenceService,
    private readonly globalCountryFinance: GlobalCountryFinanceService,
    private readonly mealPlanning: MealPlanningService,
  ) {}

  @Get()
  getPlan() {
    return this.budgetService.createPlan();
  }

  @Post('weekly-plan')
  @UseGuards(JwtAuthGuard)
  weeklyPlan(
    @Request() req: { user: { id: string } },
    @Query('monthlyBudget') monthlyBudgetText?: string,
    @Query('familySize') familySizeText?: string,
    @Query('goal') goal = 'healthy affordable meals',
    @Query('countryCode') countryCode = '',
    @Query('weeklyBudget') weeklyBudgetText?: string,
    @Query('days') daysText?: string,
    @Query('mealsPerDay') mealsPerDayText?: string,
    @Query('currency') currency?: string,
  ) {
    return this.budgetService.createWeeklyPlan(
      req.user.id,
      {
        monthlyBudget: Number(monthlyBudgetText),
        familySize: Number(familySizeText),
        goal,
        ...(weeklyBudgetText ? { weeklyBudget: Number(weeklyBudgetText) } : {}),
        ...(daysText ? { days: Number(daysText) } : {}),
        ...(mealsPerDayText ? { mealsPerDay: Number(mealsPerDayText) } : {}),
        ...(currency ? { currency } : {}),
      },
      countryCode,
    );
  }

  @Get('meal-plan')
  @UseGuards(JwtAuthGuard)
  mealPlan(
    @Request() req: { user: { id: string } },
    @Query('servings') servingsText?: string,
    @Query('countryCode') countryCode = '',
  ) {
    const servings = servingsText?.trim() ? Number(servingsText) : 1;
    return this.mealPlanning.createMealPlan(req.user.id, servings, countryCode);
  }

  @Get('country')
  getCountryContext(@Query('countryCode') countryCode = '') {
    return this.globalCountryFinance.getFinanceContext(countryCode);
  }

  @Get('countries')
  getSupportedCountries() {
    return this.globalCountryFinance.getSupportedCountryCodes();
  }
}
