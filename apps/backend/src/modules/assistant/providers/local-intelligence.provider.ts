import { Injectable } from '@nestjs/common';
import { AiProvider, AiProviderRequest, AiProviderResponse } from '../services/ai-provider.types';

@Injectable()
export class LocalIntelligenceProvider implements AiProvider {
  readonly id = 'local-core';
  readonly name = 'Local Assistant Core';

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    const text = request.input.trim();
    if (!text) return { providerId: this.id, text: '', handled: false };

    const normalized = text.toLowerCase();
    if (/(شیر|milk).*(سبد|basket)|(سبد|basket).*(شیر|milk)/i.test(normalized)) {
      return { providerId: this.id, text: 'باشه، شیر رو برای سبد خرید آماده می‌کنم.', handled: true, intent: 'ADD_TO_BASKET' };
    }
    if (/(چی|چه).*(بخور|درست).*(امشب|امروز)|(غذا|شام).*(پیشنهاد|چی)/i.test(normalized)) {
      return { providerId: this.id, text: 'حتماً. موجودی خونه و برنامه غذایی‌ات رو بررسی می‌کنم تا چند گزینه مناسب پیشنهاد بدم.', handled: true, intent: 'RECOMMEND_MEAL' };
    }
    if (/(کالری|پروتئین).*(امروز|امروزم)/i.test(normalized)) {
      return { providerId: this.id, text: 'باشه، خلاصه تغذیه امروزت رو از اطلاعات ثبت‌شده بررسی می‌کنم.', handled: true, intent: 'GET_NUTRITION_SUMMARY' };
    }
    return {
      providerId: this.id,
      text: 'متوجه شدم. برای این درخواست هنوز یک فرمان محلی مشخص ندارم، اما می‌تونم از اطلاعات شخصی و قابلیت‌های خود دستیار برای انجامش استفاده کنم.',
      handled: false,
    };
  }
}
