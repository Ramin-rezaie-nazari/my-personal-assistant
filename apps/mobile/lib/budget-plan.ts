import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RecipeBudgetPlanResponse } from './api';

export type BudgetPlanWithActions = RecipeBudgetPlanResponse & {
  budget: RecipeBudgetPlanResponse['budget'] & { nextActions?: string[] };
};

export function getBudgetCacheKey(userId: string, recipeId: string, servings: number, budget: number, currency: string) {
  return `mya:budget:${userId}:${recipeId}:${servings}:${budget}:${currency.trim().toUpperCase()}`;
}

export async function saveBudgetPlanCache(key: string, plan: BudgetPlanWithActions) {
  await AsyncStorage.setItem(key, JSON.stringify({ savedAt: new Date().toISOString(), plan }));
}

export async function loadBudgetPlanCache(key: string): Promise<{ savedAt: string; plan: BudgetPlanWithActions } | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { savedAt?: unknown; plan?: BudgetPlanWithActions };
    if (typeof parsed.savedAt !== 'string' || !parsed.plan || typeof parsed.plan !== 'object') return null;
    return { savedAt: parsed.savedAt, plan: parsed.plan };
  } catch {
    return null;
  }
}

export const budgetActionCopy: Record<string, readonly [string, string]> = {
  refresh_prices: ['Refresh prices', 'به‌روزرسانی قیمت‌ها'],
  review_currency: ['Review currency', 'ارز را بررسی کن'],
  review_units: ['Review units', 'واحدها را بررسی کن'],
  increase_budget: ['Increase budget', 'بودجه را افزایش بده'],
  review_price_evidence: ['Review price evidence', 'شواهد قیمت را بررسی کن'],
};
