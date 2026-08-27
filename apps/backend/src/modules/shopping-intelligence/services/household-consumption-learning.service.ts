import { Injectable } from '@nestjs/common';

export type ConsumptionEvent = {
  productKey: string;
  quantity: number;
  occurredAt: Date;
  source?: 'manual' | 'inventory' | 'purchase' | 'recipe';
};
export type ConsumptionForecast = {
  productKey: string;
  dailyRate: number;
  confidence: number;
  daysObserved: number;
  sampleCount: number;
  next7DayNeed: number;
  next30DayNeed: number;
};

@Injectable()
export class HouseholdConsumptionLearningService {
  private readonly events = new Map<string, ConsumptionEvent[]>();

  record(event: ConsumptionEvent): ConsumptionEvent {
    if (event.quantity <= 0) {
      throw new Error('Consumption quantity must be positive');
    }
    const history = this.events.get(event.productKey) ?? [];
    const storedEvent = { ...event, source: event.source ?? 'manual' };
    history.push(storedEvent);
    history.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    this.events.set(event.productKey, history.slice(-500));
    return storedEvent;
  }

  forecast(productKey: string, now = new Date()): ConsumptionForecast {
    return this.forecastFromHistory(productKey, this.history(productKey), now);
  }

  forecastFromHistory(
    productKey: string,
    history: ConsumptionEvent[],
    now = new Date(),
  ): ConsumptionForecast {
    const normalized = history
      .filter((event) => event.quantity > 0 && Number.isFinite(event.quantity))
      .map((event) => ({ ...event }))
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    if (normalized.length < 2) {
      return {
        productKey,
        dailyRate: 0,
        confidence: 0,
        daysObserved: 0,
        sampleCount: normalized.length,
        next7DayNeed: 0,
        next30DayNeed: 0,
      };
    }

    const first = normalized[0].occurredAt.getTime();
    const last = normalized[normalized.length - 1].occurredAt.getTime();
    const spanDays = Math.max(1, (last - first) / 86_400_000);
    const total = normalized.reduce((sum, event) => sum + event.quantity, 0);
    const dailyRate = total / spanDays;
    const recent = normalized.filter(
      (event) => now.getTime() - event.occurredAt.getTime() <= 30 * 86_400_000,
    );
    const recencyScore = recent.length / Math.max(1, normalized.length);
    const confidence = Math.max(
      0,
      Math.min(
        1,
        0.2 +
          Math.min(0.45, normalized.length / 20) +
          Math.min(0.2, spanDays / 60) +
          Math.min(0.15, recencyScore * 0.15),
      ),
    );

    return {
      productKey,
      dailyRate,
      confidence,
      daysObserved: spanDays,
      sampleCount: normalized.length,
      next7DayNeed: dailyRate * 7,
      next30DayNeed: dailyRate * 30,
    };
  }

  history(productKey: string): ConsumptionEvent[] {
    return [...(this.events.get(productKey) ?? [])];
  }
}
