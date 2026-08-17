import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  AiProviderRequest,
  AiProviderResponse,
} from '../services/ai-provider.types';
import { LocalLanguageUnderstandingService } from '../services/local-language-understanding.service';

@Injectable()
export class LocalIntelligenceProvider implements AiProvider {
  readonly id = 'local-core';
  readonly name = 'Local Assistant Core';

  constructor(private readonly language: LocalLanguageUnderstandingService) {}

  async isAvailable(): Promise<boolean> {
    await Promise.resolve();
    return true;
  }

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    const understanding = this.language.understand(request.input);
    const food = this.formatFood(understanding.entities.food);

    switch (understanding.intent) {
      case 'ADD_TO_BASKET':
        return {
          providerId: this.id,
          text: food
            ? `باشه، ${food} رو به سبد خرید اضافه می‌کنم.`
            : 'باشه، مورد موردنظر رو برای سبد خرید آماده می‌کنم.',
        };
      case 'REMOVE_FROM_BASKET':
        return {
          providerId: this.id,
          text: food
            ? `${food} رو از سبد خرید حذف می‌کنم.`
            : 'باشه، مورد موردنظر رو از سبد خرید حذف می‌کنم.',
        };
      case 'RECOMMEND_MEAL':
        return {
          providerId: this.id,
          text: 'حتماً. موجودی خونه و برنامه غذایی‌ات رو بررسی می‌کنم تا گزینه مناسب پیدا کنم.',
        };
      case 'GET_NUTRITION_SUMMARY':
        return {
          providerId: this.id,
          text: 'باشه، خلاصه تغذیه امروزت رو از اطلاعات ثبت‌شده بررسی می‌کنم.',
        };
      case 'CREATE_REMINDER':
        return {
          providerId: this.id,
          text: 'حتماً. درخواست یادآوری رو بررسی می‌کنم تا زمان مناسبش رو تنظیم کنم.',
        };
      default:
        return {
          providerId: this.id,
          text: 'درخواستت رو متوجه شدم، اما برای انجام دقیقش به اطلاعات بیشتری نیاز دارم.',
        };
    }
  }

  private formatFood(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return value ? `${value}` : undefined;
    }
    if (Array.isArray(value)) {
      const items = value.filter((item): item is string => typeof item === 'string');
      return items.length ? items.join(', ') : undefined;
    }
    return undefined;
  }
}
