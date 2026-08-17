import { Injectable } from '@nestjs/common';

import {
  AiProviderRequest,
  AiProviderResponse,
  AiTask,
} from './ai-provider.types';
import { DeviceAwareLocalRuntimeService, DeviceRuntimeSignals } from './device-aware-local-runtime.service';
import { LocalLanguageUnderstandingService } from './local-language-understanding.service';

export type LocalIntelligenceResult = AiProviderResponse & {
  task: AiTask;
  confidence: number;
  source: 'deterministic' | 'contextual-template';
  runtimeTier: 'tiny' | 'light' | 'standard' | 'full';
  modelClass: 'deterministic' | 'tiny-local' | 'small-local' | 'medium-local';
};

@Injectable()
export class LocalIntelligenceCoreService {
  constructor(
    private readonly language: LocalLanguageUnderstandingService,
    private readonly runtime: DeviceAwareLocalRuntimeService,
  ) {}

  async generate(request: AiProviderRequest): Promise<LocalIntelligenceResult> {
    const runtimeProfile = this.runtime.profile(this.deviceSignals(request.context));

    switch (request.task ?? 'intent-understanding') {
      case 'intent-understanding':
        return this.withRuntime(this.intentResult(request), runtimeProfile);
      case 'planning':
        return this.withRuntime(this.planResult(request), runtimeProfile);
      case 'text-generation':
        return this.withRuntime(this.textResult(request), runtimeProfile);
      default:
        return {
          providerId: 'local-core',
          task: request.task ?? 'text-generation',
          text: 'برای این نوع درخواست، هنوز قابلیت محلی مناسب فعال نشده است.',
          confidence: 0.2,
          source: 'deterministic',
          runtimeTier: runtimeProfile.tier,
          modelClass: runtimeProfile.preferredModelClass,
        };
    }
  }

  private intentResult(request: AiProviderRequest): Promise<LocalIntelligenceResultBase> {
    const understanding = this.language.understand(request.input);
    return Promise.resolve({
      providerId: 'local-core',
      task: 'intent-understanding',
      text: JSON.stringify(understanding),
      confidence: understanding.confidence,
      source: 'deterministic',
    });
  }

  private planResult(request: AiProviderRequest): Promise<LocalIntelligenceResultBase> {
    const understanding = this.language.understand(request.input);
    const entities = understanding.entities;
    const steps: string[] = [];

    if (understanding.intent === 'ADD_WATER') steps.push('ثبت مقدار آب مصرف‌شده');
    if (understanding.intent === 'GET_NUTRITION_SUMMARY') steps.push('بررسی خلاصه تغذیه امروز');
    if (understanding.intent === 'RECOMMEND_MEAL') steps.push('بررسی هدف تغذیه و موجودی');
    if (understanding.intent === 'ADD_TO_BASKET') steps.push('بررسی قلم و افزودن به سبد خرید');
    if (understanding.intent === 'CREATE_REMINDER') steps.push('بررسی زمان و ساخت یادآوری');
    if (typeof entities.time === 'string') steps.push(`تنظیم زمان روی ${entities.time}`);

    if (!steps.length) steps.push('درک درخواست', 'بررسی context کاربر', 'انتخاب اقدام مناسب');

    return Promise.resolve({
      providerId: 'local-core',
      task: 'planning',
      text: JSON.stringify({ intent: understanding.intent, steps }),
      confidence: understanding.confidence,
      source: 'deterministic',
    });
  }

  private textResult(request: AiProviderRequest): Promise<LocalIntelligenceResultBase> {
    const understanding = this.language.understand(request.input);
    const context = this.readContext(request.context);
    const text = this.compose(understanding.intent, request.input, context);

    return Promise.resolve({
      providerId: 'local-core',
      task: 'text-generation',
      text,
      confidence: understanding.confidence > 0 ? understanding.confidence : 0.55,
      source: context ? 'contextual-template' : 'deterministic',
    });
  }

  private withRuntime(
    result: Promise<LocalIntelligenceResultBase>,
    profile: ReturnType<DeviceAwareLocalRuntimeService['profile']>,
  ): Promise<LocalIntelligenceResult> {
    return result.then((value) => ({
      ...value,
      runtimeTier: profile.tier,
      modelClass: profile.preferredModelClass,
    }));
  }

  private deviceSignals(context?: Record<string, unknown>): DeviceRuntimeSignals {
    const signals = context?.deviceRuntime;
    return signals && typeof signals === 'object' ? (signals as DeviceRuntimeSignals) : {};
  }

  private compose(intent: string, input: string, context?: LocalContext): string {
    if (intent === 'GET_NUTRITION_SUMMARY' && context?.nutrition) {
      const calories = context.nutrition.calories ?? context.nutrition.meals?.calories;
      const protein = context.nutrition.protein ?? context.nutrition.meals?.protein;
      const calorieText = typeof calories === 'number' ? `${Math.round(calories)} کالری` : 'کالری نامشخص';
      const proteinText = typeof protein === 'number' ? `${Math.round(protein)} گرم پروتئین` : 'پروتئین نامشخص';
      return `تا اینجای امروز حدود ${calorieText} و ${proteinText} ثبت کردی.`;
    }

    if (intent === 'ADD_WATER') {
      const amount = context?.waterMl;
      return typeof amount === 'number'
        ? `تا الان ${Math.round(amount)} میلی‌لیتر آب برای امروز ثبت شده.`
        : 'مقدار آب مصرفی امروزت رو بر اساس ثبت‌های فعلی بررسی می‌کنم.';
    }

    if (intent === 'RECOMMEND_MEAL') {
      const calories = context?.nutrition?.calories ?? context?.nutrition?.meals?.calories;
      const remaining = context?.nutrition?.remaining?.calories;
      if (typeof remaining === 'number') {
        return `با توجه به وضعیت امروزت، بهتره پیشنهاد بعدی حدود ${Math.round(remaining)} کالری یا کمتر باشه. موجودی خونه و هدفت رو هم باید در انتخاب در نظر بگیریم.`;
      }
      if (typeof calories === 'number') {
        return `تا الان حدود ${Math.round(calories)} کالری ثبت کردی؛ برای پیشنهاد دقیق‌تر باید هدفت و موجودی خونه رو هم در نظر بگیریم.`;
      }
      return 'حتماً؛ پیشنهاد غذا رو باید بر اساس هدف، بودجه و موجودی خونه انتخاب کنیم.';
    }

    if (intent === 'CREATE_REMINDER') return 'حتماً؛ زمان و جزئیات یادآوری رو بررسی می‌کنم.';
    if (intent === 'ADD_TO_BASKET') return 'حتماً؛ مورد رو با موجودی و سبد خرید فعلی تطبیق می‌دم.';
    if (intent === 'REMOVE_FROM_BASKET') return 'باشه؛ مورد رو از سبد خرید فعلی بررسی و حذف می‌کنم.';

    if (context?.life?.goals?.active && intent === 'UNKNOWN') {
      return `درخواستت رو گرفتم. با توجه به برنامه و هدف‌های فعلیت، اول context امروزت رو بررسی می‌کنم و بعد بهترین مسیر رو انتخاب می‌کنم.`;
    }

    return input.trim()
      ? 'درخواستت رو متوجه شدم. برای اینکه جواب دقیق بدم، context امروزت رو هم در نظر می‌گیرم.'
      : 'بگو امروز برات چه کاری انجام بدم.';
  }

  private readContext(context?: Record<string, unknown>): LocalContext | undefined {
    if (!context || typeof context !== 'object') return undefined;
    const nutrition = this.record(context.nutrition);
    const life = this.record(context.life);
    const daily = nutrition?.daily;
    return {
      nutrition,
      life,
      waterMl: typeof nutrition?.waterMl === 'number'
        ? nutrition.waterMl
        : typeof daily?.waterMl === 'number'
          ? daily.waterMl
          : undefined,
    };
  }

  private record(value: unknown): Record<string, any> | undefined {
    return value && typeof value === 'object' ? (value as Record<string, any>) : undefined;
  }
}

type LocalIntelligenceResultBase = Omit<LocalIntelligenceResult, 'runtimeTier' | 'modelClass'>;

type LocalContext = {
  nutrition?: Record<string, any>;
  life?: Record<string, any>;
  waterMl?: number;
};
