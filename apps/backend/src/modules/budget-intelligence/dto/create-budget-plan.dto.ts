export class CreateBudgetPlanDto {
  monthlyBudget!: number;
  familySize!: number;
  goal!: string;
  weeklyBudget?: number;
  days?: number;
  mealsPerDay?: number;
  currency?: string;
}
