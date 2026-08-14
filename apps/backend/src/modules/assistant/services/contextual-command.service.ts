import { Injectable } from '@nestjs/common';
import { ConversationContextService } from './conversation-context.service';

export type ContextualCommand = {
  text: string;
  referencesPrevious: boolean;
  operation: 'create' | 'update' | 'cancel' | 'unknown';
  targetAction?: string;
  targetExecutionId?: string;
  targetResourceType?: string;
  targetResourceId?: string;
  entities: {
    quantity?: number;
    time?: string;
    durationMinutes?: number;
    relativeMinutes?: number;
    ordinal?: number;
    date?: string;
    negated?: boolean;
    confirmation?: 'yes' | 'no';
  };
}

@Injectable()
export class ContextualCommandService {
  constructor(private readonly context: ConversationContextService) {}

  async resolve(userId: string, text: string): Promise<ContextualCommand> {
    const normalized = this.normalize(text);
    const previous = (await this.context.get(userId)).lastAction;
    const referencesPrevious = this.referencesPrevious(normalized);
    const operation = this.detectOperation(normalized, referencesPrevious);
    return {
      text,
      referencesPrevious,
      operation,
      targetAction: referencesPrevious ? previous?.action : undefined,
      targetExecutionId: referencesPrevious ? previous?.executionId : undefined,
      targetResourceType: referencesPrevious ? previous?.resourceType : undefined,
      targetResourceId: referencesPrevious ? previous?.resourceId : undefined,
      entities: this.extractEntities(normalized),
    };
  }

  private detectOperation(text: string, referencesPrevious: boolean): ContextualCommand['operation'] {
    if (this.matches(text, ['cancel', 'delete', 'remove', 'لغو', 'حذف', 'پاک کن', 'بردار', 'کنسل', 'بیخیال'])) return 'cancel';
    if (this.matches(text, ['change', 'edit', 'move', 'update', 'make it', 'instead', 'تغییر', 'ویرایش', 'جابجا', 'عوض', 'اصلاح', 'به جاش', 'بجاش'])) return 'update';
    if (referencesPrevious && this.matches(text, ['نه', 'نخیر', 'نمیخوام', 'نمی خوام'])) return 'update';
    if (this.matches(text, ['remind', 'schedule', 'create', 'add', 'یادم بنداز', 'یادآوری', 'قرار بده', 'اضافه', 'بساز', 'ثبت کن', 'بخر'])) return 'create';
    return 'unknown';
  }

  private normalize(input: string): string {
    return input.trim().toLowerCase()
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[؟?!،؛]/g, ' ').replace(/‌/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private referencesPrevious(text: string): boolean {
    return this.matches(text, [
      'that', 'it', 'this', 'same', 'previous', 'earlier', 'the last one',
      'همون', 'همون قبلی', 'همون یکی', 'همین', 'اینو', 'این یکی', 'قبلی',
      'اونو', 'اون یکی', 'دوباره', 'باز هم', 'به جاش', 'بجاش', 'همونی که',
    ]);
  }

  private extractEntities(text: string): ContextualCommand['entities'] {
    const entities: ContextualCommand['entities'] = {};
    const quantity = text.match(/\b(\d+(?:\.\d+)?)\s*(?:تا|عدد|مورد|بار|x)?\b/);
    if (quantity) entities.quantity = Number(quantity[1]);
    const time = text.match(/\b([01]?\d|2[0-3])\s*(?::|\.)([0-5]\d)\b/);
    if (time) entities.time = `${time[1].padStart(2, '0')}:${time[2]}`;
    const duration = text.match(/\b(\d{1,3})\s*(?:min|mins|minute|minutes|دقیقه)\b/i);
    if (duration) entities.durationMinutes = Number(duration[1]);
    const relative = text.match(/\b(\d{1,3})\s*(?:min|mins|minute|minutes|دقیقه)\s*(?:بعد|دیگه|later|from now)\b/i);
    if (relative) entities.relativeMinutes = Number(relative[1]);
    if (this.matches(text, ['اول', 'اولی', 'first'])) entities.ordinal = 1;
    else if (this.matches(text, ['دوم', 'دومی', 'second'])) entities.ordinal = 2;
    else if (this.matches(text, ['سوم', 'سومی', 'third'])) entities.ordinal = 3;
    if (this.matches(text, ['امروز', 'today'])) entities.date = 'today';
    else if (this.matches(text, ['فردا', 'tomorrow'])) entities.date = 'tomorrow';
    else if (this.matches(text, ['پس فردا', 'پس‌فردا'])) entities.date = 'day_after_tomorrow';
    if (this.matches(text, ['نه', 'نخیر', 'نه ممنون', 'نمیخوام', 'نمی خوام', 'no', 'nope'])) entities.confirmation = 'no';
    else if (this.matches(text, ['بله', 'آره', 'اره', 'حتما', 'باشه', 'اوکی', 'yes', 'sure'])) entities.confirmation = 'yes';
    if (this.matches(text, ['نه', 'بدون', 'نذار', 'نمیخوام', 'نمی خوام'])) entities.negated = true;
    return entities;
  }

  private matches(text: string, phrases: string[]): boolean { return phrases.some((phrase) => text.includes(phrase)); }
}
