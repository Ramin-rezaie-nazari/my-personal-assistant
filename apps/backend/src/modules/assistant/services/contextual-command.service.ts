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
  entities: { quantity?: number; time?: string; durationMinutes?: number };
};

@Injectable()
export class ContextualCommandService {
  constructor(private readonly context: ConversationContextService) {}

  async resolve(userId: string, text: string): Promise<ContextualCommand> {
    const normalized = this.normalize(text);
    const previous = (await this.context.get(userId)).lastAction;
    const referencesPrevious = this.referencesPrevious(normalized);
    const operation: ContextualCommand['operation'] =
      this.matches(normalized, ['change', 'edit', 'move', 'update', 'make it', 'instead', 'تغییر', 'ویرایش', 'جابجا', 'بذار', 'کنش', 'کن'])
        ? 'update'
        : this.matches(normalized, ['cancel', 'delete', 'remove', 'لغو', 'حذف', 'پاک کن', 'بردار'])
          ? 'cancel'
          : this.matches(normalized, ['remind', 'schedule', 'create', 'add', 'یادم بنداز', 'قرار بده', 'اضافه', 'بساز', 'ثبت کن'])
            ? 'create'
            : 'unknown';

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

  private normalize(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[؟?!،؛]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private referencesPrevious(text: string): boolean {
    return this.matches(text, [
      'that', 'it', 'this', 'same', 'previous', 'earlier', 'the last one',
      'همون', 'همون قبلی', 'این', 'اینو', 'این یکی', 'قبلی', 'اون', 'اونو', 'اون یکی', 'دوباره', 'همین',
    ]);
  }

  private extractEntities(text: string): ContextualCommand['entities'] {
    const entities: ContextualCommand['entities'] = {};
    const quantity = text.match(/\b(\d+(?:\.\d+)?)\s*(?:تا|عدد|مورد|بار|x)?\b/);
    if (quantity) entities.quantity = Number(quantity[1]);
    const time = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (time) entities.time = `${time[1].padStart(2, '0')}:${time[2]}`;
    const duration = text.match(/\b(\d{1,3})\s*(?:min|mins|minute|minutes|دقیقه)\b/i);
    if (duration) entities.durationMinutes = Number(duration[1]);
    return entities;
  }

  private matches(text: string, phrases: string[]): boolean {
    return phrases.some((phrase) => text.includes(phrase));
  }
}
