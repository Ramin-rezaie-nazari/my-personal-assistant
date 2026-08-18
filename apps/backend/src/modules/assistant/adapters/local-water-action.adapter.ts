import { Injectable, OnModuleInit } from '@nestjs/common';

import { DailyService } from '../../daily/services/daily.service';
import { DecisionActionAdapterService } from '../../personal-brain/services/decision-action-adapter.service';
import { DecisionCandidate } from '../../personal-brain/services/unified-decision-engine.service';

@Injectable()
export class LocalWaterActionAdapter implements OnModuleInit {
  readonly actions = ['add_water'];

  constructor(
    private readonly dailyService: DailyService,
    private readonly adapters: DecisionActionAdapterService,
  ) {}

  onModuleInit() {
    this.adapters.register(this);
  }

  supports(candidate: DecisionCandidate): boolean {
    return candidate.action === 'add_water';
  }

  async execute(
    _candidate: DecisionCandidate,
    context: Record<string, unknown>,
  ) {
    const userId = context.userId;
    if (typeof userId !== 'string' || !userId) throw new Error('user_id_missing');

    const understanding = context.localUnderstanding as { entities?: Record<string, unknown> } | undefined;
    const entities = understanding?.entities ?? {};
    const amount = typeof entities.waterAmountMl === 'number'
      ? entities.waterAmountMl
      : typeof entities.quantity === 'number'
        ? entities.quantity
        : undefined;
    if (!amount || !Number.isFinite(amount) || amount <= 0) throw new Error('water_amount_missing');

    const dateKey = typeof context.dateKey === 'string' ? context.dateKey : undefined;
    const dailyLog = await this.dailyService.addWater(userId, amount, dateKey);

    return {
      message: `${Math.round(amount)} میلی‌لیتر آب به امروزت اضافه شد.`,
      amountMl: Math.round(amount),
      dailyLog,
    };
  }
}
