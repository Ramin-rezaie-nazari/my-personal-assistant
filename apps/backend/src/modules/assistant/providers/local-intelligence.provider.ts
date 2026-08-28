import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  AiProviderRequest,
  AiProviderResponse,
} from '../services/ai-provider.types';
import { LocalLanguageUnderstandingService } from '../services/local-language-understanding.service';
import { MultilingualConstraintExtractionService } from '../services/multilingual-constraint-extraction.service';

@Injectable()
export class LocalIntelligenceProvider implements AiProvider {
  readonly id = 'local-core';
  readonly name = 'Local Assistant Core';

  constructor(
    private readonly language: LocalLanguageUnderstandingService,
    private readonly constraints: MultilingualConstraintExtractionService,
  ) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    const understanding = this.language.understand(request.input);
    const extracted = this.constraints.extract(request.input, understanding.language);
    const food = understanding.entities.food;
    const metadata = {
      locale: understanding.language,
      constraints: extracted.constraints,
      conditional: extracted.conditional,
      contradictory: extracted.contradictory,
    };

    if (extracted.contradictory) {
      return {
        providerId: this.id,
        text: 'این درخواست چند شرط متناقض دارد؛ قبل از اجرا باید دقیق‌تر مشخصش کنیم.',
        metadata,
      };
    }

    switch (understanding.intent) {
      case 'ADD_TO_BASKET':
        return {
          providerId: this.id,
          text: food
            ? `باشه، ${food} رو به سبد خرید اضافه می‌کنم.`
            : 'باشه، مورد موردنظر رو برای سبد خرید آماده می‌کنم.',
          metadata,
        };
      case 'REMOVE_FROM_BASKET':
        return {
          providerId: this.id,
          text: food
            ? `${food} رو از سبد خرید حذف می‌کنم.`
            : 'باشه، مورد موردنظر رو از سبد خرید حذف می‌کنم.',
          metadata,
        };
      case 'RECOMMEND_MEAL':
        return {
          providerId: this.id,
          text: 'حتماً. موجودی خونه و برنامه غذایی‌ات رو بررسی می‌کنم تا گزینه مناسب پیدا کنم.',
          metadata,
        };
      case 'GET_NUTRITION_SUMMARY':
        return {
          providerId: this.id,
          text: 'باشه، خلاصه تغذیه امروزت رو از اطلاعات ثبت‌شده بررسی می‌کنم.',
          metadata,
        };
      case 'CREATE_REMINDER':
        return {
          providerId: this.id,
          text: 'حتماً. درخواست یادآوری رو بررسی می‌کنم تا زمان مناسبش رو تنظیم کنم.',
          metadata,
        };
      default:
        return {
          providerId: this.id,
          text: 'درخواستت رو متوجه شدم، اما برای انجام دقیقش به اطلاعات بیشتری نیاز دارم.',
          metadata,
        };
    }
  }
}
