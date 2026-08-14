import { Injectable } from '@nestjs/common';
import { AiProvider, AiProviderRequest, AiProviderResponse } from '../services/ai-provider.types';

@Injectable()
export class LocalIntelligenceProvider implements AiProvider {
  readonly id = 'local-core';
  readonly name = 'Local Assistant Core';

  async isAvailable(): Promise<boolean> { return true; }

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    const text = request.input.trim();
    if (!text) return { providerId: this.id, text: '' };
    const normalized = text.toLowerCase();
    if (/(شیر|milk).*(سبد|basket)|(سبد|basket).*(شیر|milk)/i.test(normalized)) {
      return { providerId: this.id, text: 'باشه، شیر رو برای سبد خرید آماده می‌کنم.' };
    }
    if (/(چی|چه).*(بخور|درست).*(امشب|امروز)|(غذا|شام).*(پیشنهاد|چی)/i.test(normalized)) {
      return { providerId: this.id, text: 'حتماً. موجودی خونه و برنامه غذایی‌ات رو بررسی می‌کنم تا چند گزینه مناسب پیشنهاد بدم.' };
    }
    if (/(کالری|پروتئین).*(امروز|امروزم)/i.test(normalized)) {
      return { providerId: this.id, text: 'باشه، خلاصه تغذیه امروزت رو از اطلاعات ثبت‌شده بررسی می‌کنم.' };
    }
    return { providerId: this.id, text: 'متوجه شدم. برای این درخواست هنوز یک فرمان محلی مشخص ندارم، اما می‌تونم از اطلاعات شخصی و قابلیت‌های خود دستیار برای انجامش استفاده کنم.' };
  }
}
