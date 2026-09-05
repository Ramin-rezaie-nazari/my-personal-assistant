export class CreateRecommendationDto {
  targetServings!: number;
  countryCode?: string;
  maxCalories?: number;
  minProteinGrams?: number;
  maxMissingIngredients?: number;
}
