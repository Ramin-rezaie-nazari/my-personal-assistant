import { Injectable } from '@nestjs/common';

export type ConsumptionEvent = { productKey: string; quantity: number; occurredAt: Date; source?: 'manual' | 'inventory' | 'purchase' | 'recipe' };
export type ConsumptionForecast = { productKey: string; dailyRate: number; confidence: number; daysObserved: number; sampleCount: number; next7DayNeed: number; next30DayNeed: number };

@Injectable()
export class HouseholdConsumptionLearningService {
  private readonly events = new Map<string, ConsumptionEvent[]>();

  record(event: ConsumptionEvent): ConsumptionEvent {
    if (event.quantity <= 0) throw new Error('Consumption quantity must be positive');
    const history = this.events.get(event.productKey) ?? [];
    history.push({ ...event, source: event.source ?? 'manual' });
    history.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    this.events.set(event.productKey, history.slice(-500));
    return event;
  }

  forecast(productKey: string, now = new Date()): ConsumptionForecast {
    const history = this.events.get(productKey) ?? [];
    if (history.length < 2) return { productKey, dailyRate: 0, confidence: 0, daysObserved: 0, sampleCount: history.length, next7DayNeed: 0, next30DayNeed: 0 };
    const first = history[0].occurredAt.getTime();
    const last = history[history.length - 1].occurredAt.getTime();
    const spanDays = Math.max(1, (last - first) / 86_400_000);
    const total = history.reduce((sum, event) => sum + event.quantity, 0);
    const dailyRate = total / spanDays;
    const recent = history.filter((event) => now.getTime() - event.occurredAt.getTime() <= 30 * 86_400_000);
    const confidence = Math.max(0, Math.min(1, 0.25 + Math.min(0.5, recent.length / 20) + Math.min(0.25, spanDays / 60)));
    return { productKey, dailyRate, confidence, daysObserved: spanDays, sampleCount: history.length, next7DayNeed: dailyRate * 7, next30DayNeed: dailyRate * 30 };
  }

  history(productKey: string): ConsumptionEvent[] {
    return [...(this.events.get(productKey) ?? [])];
  }
}
