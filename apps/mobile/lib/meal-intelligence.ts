import { FoodItem, NutritionSummary } from './api';

export type SmartMealSuggestion = {
  id: string;
  title: string;
  description: string;
  foods: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  score: number;
  reason: string;
};

function sumFoods(foods: FoodItem[]) {
  return foods.reduce((sum, food) => ({
    calories: sum.calories + food.calories,
    protein: sum.protein + food.protein,
    carbs: sum.carbs + food.carbs,
    fat: sum.fat + food.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function scoreMeal(macros: ReturnType<typeof sumFoods>, summary: NutritionSummary) {
  const calorieTarget = summary.remaining.calories ?? 500;
  const proteinTarget = summary.remaining.protein ?? 30;
  const calorieFit = 1 - Math.min(1, Math.abs(macros.calories - calorieTarget) / Math.max(250, calorieTarget));
  const proteinFit = 1 - Math.min(1, Math.abs(macros.protein - proteinTarget) / Math.max(20, proteinTarget));
  return Math.round((calorieFit * 45 + proteinFit * 55) * 100) / 100;
}

export function buildSmartMealSuggestions(foods: FoodItem[], summary: NutritionSummary): SmartMealSuggestion[] {
  const proteins = foods.filter((food) => food.protein >= 10).slice(0, 12);
  const sides = foods.filter((food) => food.protein < 10 && food.calories <= 250).slice(0, 18);
  const suggestions: SmartMealSuggestion[] = [];

  proteins.forEach((protein, index) => {
    const candidates = sides.filter((side) => side.id !== protein.id).slice(index % 4, (index % 4) + 2);
    const selected = [protein, ...candidates];
    if (selected.length < 2) return;
    const macros = sumFoods(selected);
    const score = scoreMeal(macros, summary);
    const remainingProtein = summary.remaining.protein ?? 0;
    const remainingCalories = summary.remaining.calories ?? 0;
    const reason = remainingProtein > remainingCalories / 15
      ? 'Protein is your tighter target, so this option prioritizes protein.'
      : 'This option stays close to the calories you have left today.';
    suggestions.push({ id: `smart-${protein.id}-${index}`, title: `${protein.name} bowl`, description: `A quick combination built from your available food catalog.`, foods: selected, ...macros, score, reason });
  });

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 6);
}
