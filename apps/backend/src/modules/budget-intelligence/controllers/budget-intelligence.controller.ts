import { BadRequestException, Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BudgetIntelligenceService } from '../services/budget-intelligence.service';
import { GlobalCountryFinanceService } from '../services/global-country-finance.service';
import { MealPlanningService } from '../services/meal-planning.service';

@Controller('budget-intelligence')
@UseGuards(JwtAuthGuard)
export class BudgetIntelligenceController {
  constructor(
    private readonly budget: BudgetIntelligenceService,
    private readonly globalCountryFinance: GlobalCountryFinanceService,
    private readonly mealPlanning: MealPlanningService,
  ) {}

  @Get('plan')
  plan(
    @Request() req: { user: { id: string } },
    @Query('budget') budgetText?: string,
    @Query('currency') currency?: string,
  ) {
    const budget = Number(budgetText);
    if (budgetText?.trim() === '' || !Number.isFinite(budget))
      throw new BadRequestException('budget must be a finite number');
    if (!currency?.trim())
      throw new BadRequestException('currency is required');
    return this.budget.createPlan(req.user.id, budget, currency);
  }

  @Get('meal-plan')
  mealPlan(
    @Request() req: { user: { id: string } },
    @Query('servings') servingsText?: string,
    @Query('countryCode') countryCode = '',
  ) {
    const servings = servingsText?.trim() ? Number(servingsText) : 1;
    if (!Number.isInteger(servings) || servings <= 0 || servings > 10000)
      throw new BadRequestException('servings must be an integer between 1 and 10000');
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
