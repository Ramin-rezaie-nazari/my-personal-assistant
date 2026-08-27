import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { HouseholdConsumptionLearningService } from './household-consumption-learning.service';

@Injectable()
export class PersistentConsumptionForecastService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learning: HouseholdConsumptionLearningService,
  ) {}

  async forecast(userId: string, foodId: string, now = new Date()) {
    const events = await this.prisma.inventoryEvent.findMany({
      where: {
        userId,
        foodId,
        type: { in: ['consume', 'waste'] },
      },
      orderBy: { occurredAt: 'asc' },
      take: 500,
    });
    return this.learning.forecastFromHistory(
      foodId,
      events.map((event) => ({
        productKey: foodId,
        quantity: event.quantity,
        occurredAt: event.occurredAt,
        source: event.type === 'consume' ? 'inventory' : 'manual',
      })),
      now,
    );
  }

  async forecastAll(userId: string, now = new Date()) {
    const events = await this.prisma.inventoryEvent.findMany({
      where: { userId, type: { in: ['consume', 'waste'] } },
      orderBy: { occurredAt: 'asc' },
      take: 5000,
    });
    const grouped = new Map<string, typeof events>();
    for (const event of events) {
      const current = grouped.get(event.foodId) ?? [];
      current.push(event);
      grouped.set(event.foodId, current);
    }
    return Array.from(grouped.keys()).map((foodId) => {
      const history = grouped.get(foodId) ?? [];
      return this.learning.forecastFromHistory(
        foodId,
        history.map((event) => ({
          productKey: foodId,
          quantity: event.quantity,
          occurredAt: event.occurredAt,
          source: event.type === 'consume' ? 'inventory' : 'manual',
        })),
        now,
      );
    });
  }
}
