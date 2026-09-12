import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GlobalCountryFinanceService } from '../services/global-country-finance.service';
import { MealPlanningService } from '../services/meal-planning.service';

@Controller('budget-intelligence')
@UseGuards(JwtAuthGuard)
export class BudgetIntelligenceController {
  constructor(
    private readonly globalCountryFinance: GlobalCountryFinanceService,
    private readonly mealPlanning: MealPlanningService,
  ) {}

  @Get('meal-plan')
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
