import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryService } from '../../inventory/inventory.service';
import { PricePersistenceService } from '../../price-intelligence/services/price-persistence.service';
import { PriceProductKeyService } from '../../price-intelligence/services/price-product-key.service';

const PRICE_FRESHNESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type BudgetQuoteInput = { foodId: string; name: string; quantity: number; unit: string; urgency?: 'critical' | 'soon' | 'normal' | 'none' };
export type BudgetQuoteItem = { foodId: string; name: string; productKey: string; recommendedQuantity: number; unit: string; price: number | null; estimatedCost: number | null; currency: string; priceObservedAt: Date | null; priceSourceId: string | null; status: 'priced' | 'price_unavailable' | 'currency_mismatch' | 'unit_mismatch' | 'stale_price' | 'over_budget'; urgency: 'critical' | 'soon' | 'normal' | 'none'; reason: string };
type PriceEvidenceRow = { currency?: string; unit?: string | null; unitPrice?: number | null; observedAt?: Date | string; sourceId?: string };

@Injectable()
export class BudgetIntelligenceService {
  constructor(private readonly inventory: InventoryService, private readonly prices: PricePersistenceService, private readonly productKeys: PriceProductKeyService) {}
  async createPlan(userId: string, budget: number, currency: string) {
    if (!Number.isFinite(budget) || budget < 0) throw new BadRequestException('budget must be a non-negative number');
    const normalizedCurrency = normalizeCurrency(currency); const inventory = await this.inventory.list(userId);
    const candidates = inventory.filter((item) => Number(item.recommendedQuantity ?? 0) > 0 && item.food?.name).map((item) => ({ foodId: String(item.foodId), name: item.food!.name, quantity: item.recommendedQuantity, unit: item.unit, urgency: item.urgency as BudgetQuoteInput['urgency'] }));
    const quote = await this.quoteItems(candidates, normalizedCurrency, budget);
    const budgetStatus = deriveBudgetStatus(quote.items);
    return { userId, budget, currency: normalizedCurrency, totalEstimatedCost: quote.totalEstimatedCost, budgetRemaining: quote.budgetRemaining, pricedItemCount: quote.items.filter((item) => item.status === 'priced').length, itemCount: quote.items.length, budgetStatus, nextActions: deriveBudgetNextActions(quote.items), generatedDeterministically: true, items: quote.items } as const;
  }
  async quoteItems(input: BudgetQuoteInput[], currency: string, budget?: number) {
    const normalizedCurrency = normalizeCurrency(currency); if (budget !== undefined && (!Number.isFinite(budget) || budget < 0)) throw new BadRequestException('budget must be a non-negative number');
    const now = Date.now(); let remaining = budget ?? Number.POSITIVE_INFINITY; const items: BudgetQuoteItem[] = [];
    for (const candidate of input) {
      if (!Number.isFinite(candidate.quantity) || candidate.quantity <= 0) throw new BadRequestException('quote item quantity must be a positive finite number');
      const productKey = this.productKeys.fromFoodName(candidate.name); const rows = (await this.prices.latest(productKey)) as PriceEvidenceRow[];
      const urgency = candidate.urgency ?? 'normal'; const base = { foodId: candidate.foodId, name: candidate.name, productKey, recommendedQuantity: candidate.quantity, unit: candidate.unit, currency: normalizedCurrency, urgency };
      const compatibleCurrency = rows.filter((row) => row.currency === normalizedCurrency);
      if (!compatibleCurrency.length) { items.push({ ...base, price: null, estimatedCost: null, priceObservedAt: null, priceSourceId: null, status: rows.length ? 'currency_mismatch' : 'price_unavailable', reason: rows.length ? 'no_price_in_budget_currency' : 'no_price_snapshot' }); continue; }
      const compatibleUnitRows = compatibleCurrency.filter((row) => row.unit === candidate.unit && row.unitPrice != null);
      if (!compatibleUnitRows.length) { const hasUnitEvidence = compatibleCurrency.some((row) => row.unit); items.push({ ...base, price: null, estimatedCost: null, priceObservedAt: null, priceSourceId: null, status: hasUnitEvidence ? 'unit_mismatch' : 'price_unavailable', reason: hasUnitEvidence ? 'price_unit_does_not_match_recipe_unit' : 'price_unit_missing' }); continue; }
      const evidences = compatibleUnitRows.map((row) => ({ row, observedAt: new Date(row.observedAt ?? 0) })).filter(({ observedAt }) => Number.isFinite(observedAt.getTime())).sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
      if (!evidences.length) { items.push({ ...base, price: null, estimatedCost: null, priceObservedAt: null, priceSourceId: compatibleUnitRows[0].sourceId ?? null, status: 'price_unavailable', reason: 'invalid_observed_at' }); continue; }
      const fresh = evidences.find(({ observedAt }) => now - observedAt.getTime() <= PRICE_FRESHNESS_WINDOW_MS); const selected = fresh ?? evidences[0]; const observedAt = selected.observedAt;
      if (!fresh) { items.push({ ...base, price: null, estimatedCost: null, priceObservedAt: observedAt, priceSourceId: selected.row.sourceId ?? null, status: 'stale_price', reason: 'all_compatible_price_snapshots_older_than_7_days' }); continue; }
      const price = Number(selected.row.unitPrice); const estimatedCost = price * candidate.quantity;
      if (!Number.isFinite(price) || price < 0 || !Number.isFinite(estimatedCost)) { items.push({ ...base, price: null, estimatedCost: null, priceObservedAt: observedAt, priceSourceId: selected.row.sourceId ?? null, status: 'price_unavailable', reason: 'invalid_price_value' }); continue; }
      if (estimatedCost > remaining) { items.push({ ...base, price, estimatedCost, priceObservedAt: observedAt, priceSourceId: selected.row.sourceId ?? null, status: 'over_budget', reason: 'recipe_missing_quantity_exceeds_remaining_budget' }); continue; }
      remaining -= estimatedCost; items.push({ ...base, price, estimatedCost, priceObservedAt: observedAt, priceSourceId: selected.row.sourceId ?? null, status: 'priced', reason: 'recipe_missing_ingredient_fits_verified_budget' });
    }
    return { items, totalEstimatedCost: Number(((budget ?? 0) - (budget === undefined ? 0 : remaining)).toFixed(2)), budgetRemaining: budget === undefined ? null : Number(remaining.toFixed(2)) } as const;
  }
}

export function deriveBudgetStatus(items: BudgetQuoteItem[]) {
  if (!items.length) return 'within_budget' as const;
  if (items.some((item) => item.status === 'over_budget')) return 'over_budget' as const;
  const priced = items.filter((item) => item.status === 'priced').length;
  if (priced === items.length) return 'within_budget' as const;
  return priced > 0 ? 'partial_price_evidence' as const : 'insufficient_price_data' as const;
}

export function deriveBudgetNextActions(items: BudgetQuoteItem[]) {
  const actions = new Set<'refresh_prices' | 'review_currency' | 'review_units' | 'increase_budget' | 'review_price_evidence'>();
  for (const item of items) {
    if (item.status === 'price_unavailable' || item.status === 'stale_price') actions.add('refresh_prices');
    if (item.status === 'currency_mismatch') actions.add('review_currency');
    if (item.status === 'unit_mismatch') actions.add('review_units');
    if (item.status === 'over_budget') actions.add('increase_budget');
  }
  if (items.some((item) => item.status !== 'priced')) actions.add('review_price_evidence');
  return [...actions];
}

function normalizeCurrency(currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase(); if (!/^[A-Z]{3}$/.test(normalizedCurrency)) throw new BadRequestException('currency must be a 3-letter ISO currency code'); return normalizedCurrency;
}