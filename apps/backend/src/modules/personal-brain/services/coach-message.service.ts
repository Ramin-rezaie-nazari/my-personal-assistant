import { Injectable } from '@nestjs/common';
import { ProactiveCoachService, CoachAction } from './proactive-coach.service';

export type SupportedLanguage = 'fa' | 'en';

@Injectable()
export class CoachMessageService {
  constructor(private readonly coach: ProactiveCoachService) {}

  async getMessage(
    userId: string,
    language: SupportedLanguage = 'en',
    now = new Date(),
  ) {
    const result = await this.coach.getNextCoach(userId, now);
    return {
      ...result,
      message: this.translate(result.primary, language),
      language,
    };
  }

  private translate(action: CoachAction, language: SupportedLanguage) {
    if (language === 'en') return action.message;
    const fa: Record<string, string> = {
      'overdue scheduled item':
        'این کار از زمان برنامه‌ریزی‌شده گذشته و بهتر است همین حالا شروع شود.',
      'capacity exceeded':
        'ظرفیت تمرکز امروز پر شده؛ بهتر است ادامه برنامه را دوباره تنظیم کنیم.',
      'schedule conflict':
        'در برنامه تداخل وجود دارد و بهتر است برنامه باقی‌مانده دوباره چیده شود.',
      'low remaining capacity':
        'ظرفیت مفید باقی‌مانده امروز کم است؛ کار سنگین جدید اضافه نکن.',
      'smart planner recommendation':
        'این کار در حال حاضر بهترین گزینه پیشنهادی برای ادامه روز است.',
      'no urgent intervention required':
        'فعلاً کاری نیاز به مداخله فوری ندارد؛ برنامه فعلی را ادامه بده.',
    };
    return fa[action.reason] ?? action.message;
  }
}
