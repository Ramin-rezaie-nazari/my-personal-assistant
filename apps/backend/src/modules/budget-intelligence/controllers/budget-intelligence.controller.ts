import { Controller, Get, Query } from '@nestjs/common';
import { BudgetIntelligenceService } from '../services/budget-intelligence.service';
import { GlobalCountryFinanceService } from '../services/global-country-finance.service';

@Controller('budget-intelligence')
export class BudgetIntelligenceController {
  constructor(
    private readonly budgetService: BudgetIntelligenceService,
    private readonly globalCountryFinance: GlobalCountryFinanceService,
  ) {}

  @Get()
  getPlan() {
    return this.budgetService.createPlan();
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
