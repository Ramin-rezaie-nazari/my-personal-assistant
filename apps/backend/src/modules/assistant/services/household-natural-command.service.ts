import { Injectable } from '@nestjs/common';
import { InventoryService } from '../../inventory/inventory.service';
import { ShoppingService } from '../../shopping/shopping.service';
import { HouseholdItemResolutionService } from '../../shopping-intelligence/services/household-item-resolution.service';
import { LocalLanguageUnderstandingService } from './local-language-understanding.service';

export type HouseholdCommandResult = {
  handled: boolean;
  executed: boolean;
  action?: string;
  message?: string;
  result?: unknown;
  clarification?: { type: 'ambiguous_item'; query: string; candidates: Array<{ id: string; name: string; category: string }> };
};

@Injectable()
export class HouseholdNaturalCommandService {
  constructor(
    private readonly language: LocalLanguageUnderstandingService,
    private readonly resolver: HouseholdItemResolutionService,
    private readonly shopping: ShoppingService,
    private readonly inventory: InventoryService,
  ) {}

  async tryExecute(userId: string, input: string, preferredLanguage?: string): Promise<HouseholdCommandResult> {
    const local = this.language.understand(input, preferredLanguage);
    const text = local.normalizedText;
    const food = typeof local.entities.food === 'string' ? local.entities.food : undefined;
    const quantity = typeof local.entities.quantity === 'number' ? local.entities.quantity : 1;
    const action = this.actionFor(local.intent, text);
    const inspect = this.isInventoryInspection(text);

    if (inspect) {
      const result = await this.inventory.list(userId);
      return { handled: true, executed: true, action: 'inspect_inventory', result, message: 'موجودی خونه‌ات رو بررسی کردم.' };
    }
    if (!action || !food) return { handled: false, executed: false };

    const resolution = await this.resolve(userId, food);
    if (resolution.status === 'ambiguous') {
      return { handled: true, executed: false, clarification: { type: 'ambiguous_item', query: food, candidates: resolution.candidates }, message: 'چند مورد مشابه پیدا کردم؛ قبل از انجامش باید مشخص کنی کدوم مورد رو می‌خوای.' };
    }
    if (resolution.status === 'not_found') {
      return { handled: true, executed: false, message: `مورد «${food}» را در اطلاعات خانه پیدا نکردم.` };
    }

    if (action === 'add_to_basket') {
      const result = await this.shopping.addToBasket(userId, { foodId: resolution.item.id, quantity, unit: 'piece', source: 'assistant', priority: 'normal' });
      return { handled: true, executed: true, action, result, message: `«${resolution.item.name}» به سبد خرید اضافه شد.` };
    }
    if (action === 'remove_from_basket') {
      const basket = await this.shopping.listBasket(userId);
      const item = basket.find((entry) => entry.foodId === resolution.item.id && !entry.completed);
      if (!item) return { handled: true, executed: true, action, result: { changed: 0 }, message: `«${resolution.item.name}» داخل سبد خرید نبود.` };
      const result = await this.shopping.remove(userId, item.id);
      return { handled: true, executed: true, action, result, message: `«${resolution.item.name}» از سبد خرید حذف شد.` };
    }

    const inventory = await this.inventory.list(userId);
    const item = inventory.find((entry) => entry.foodId === resolution.item.id);
    if (!item) return { handled: true, executed: false, action, message: `«${resolution.item.name}» هنوز در موجودی خانه ثبت نشده.` };
    if (action === 'consume_inventory') {
      if (quantity > item.quantity) return { handled: true, executed: false, action, message: `مقدار موجود «${resolution.item.name}» برای مصرف ${quantity} واحد کافی نیست.` };
      const result = await this.inventory.consume(userId, item.id, quantity);
      return { handled: true, executed: true, action, result, message: `مصرف «${resolution.item.name}» ثبت شد.` };
    }
    const result = await this.inventory.purchase(userId, item.id, quantity);
    return { handled: true, executed: true, action, result, message: `خرید ${quantity} واحد «${resolution.item.name}» به موجودی اضافه شد.` };
  }

  private actionFor(intent: string, text: string): string | undefined {
    if (intent === 'ADD_TO_BASKET') return 'add_to_basket';
    if (intent === 'REMOVE_FROM_BASKET') return 'remove_from_basket';
    if (/مصرف|خوردم|استفاده کردم|consume|used|eaten|ate/i.test(text)) return 'consume_inventory';
    if (/بخر|خرید|purchase|buy|bought/i.test(text)) return 'purchase_inventory';
    return undefined;
  }

  private isInventoryInspection(text: string): boolean {
    return /موجودی.*(خانه|خونه)|چی.*دارم|چه چیزهایی.*دارم|inventory|what do i have|what's in my pantry|what is in my pantry/i.test(text);
  }

  private async resolve(userId: string, query: string) {
    const exact = await this.resolver.resolve(userId, query);
    if (exact.status !== 'not_found') return exact;
    if (query === 'egg') return this.resolver.resolve(userId, 'eggs');
    return exact;
  }
}
