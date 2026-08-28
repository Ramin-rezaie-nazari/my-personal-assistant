import { Injectable } from '@nestjs/common';
import { ConversationContextService } from './conversation-context.service';
import { splitMultilingualClauses } from './multilingual-clause-splitter';

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
  clauses: string[];
  intents: Array<'create' | 'update' | 'cancel' | 'unknown'>;
  contradictions: string[];
  confidence: number;
};

@Injectable()
export class ContextualCommandService {
  constructor(private readonly context: ConversationContextService) {}

  async resolve(userId: string, text: string): Promise<ContextualCommand> {
    const normalized = this.normalize(text);
    const previous = (await this.context.get(userId)).lastAction;
    const referencesPrevious = this.referencesPrevious(normalized);
    const clauses = this.splitClauses(normalized);
    const intents = clauses.map((clause) => this.detectOperation(clause, referencesPrevious));
    const operation = this.pickPrimaryIntent(intents, referencesPrevious);
    const entities = this.extractEntities(normalized);
    const contradictions = this.detectContradictions(normalized, intents, entities);

    return {
      text,
      referencesPrevious,
      operation,
      targetAction: referencesPrevious ? previous?.action : undefined,
      targetExecutionId: referencesPrevious ? previous?.executionId : undefined,
      targetResourceType: referencesPrevious ? previous?.resourceType : undefined,
      targetResourceId: referencesPrevious ? previous?.resourceId : undefined,
      entities,
      clauses,
      intents,
      contradictions,
      confidence: this.scoreConfidence(normalized, referencesPrevious, operation, entities, contradictions),
    };
  }

  private detectOperation(text: string, referencesPrevious: boolean): ContextualCommand['operation'] {
    if (this.matches(text, ['cancel', 'delete', 'remove', 'annule', 'anuleaza', 'annul', 'cancela', 'elimina', 'annulla', 'annuler', 'отмени', 'отмена', '取消', '취소', 'لغو', 'حذف', 'پاک کن', 'بردار', 'کنسل', 'بیخیال', 'ألغِ'])) return 'cancel';
    if (this.matches(text, ['change', 'edit', 'move', 'update', 'make it', 'instead', 'cambia', 'actualiza', 'modifica', 'mets à jour', 'modifie', 'ändern', 'измени', 'обнови', 'değiştir', 'güncelle', '変更', '更新', '修改', 'تغيير', 'غيّر', 'تعديل', 'تغییر', 'ویرایش', 'جابجا', 'عوض', 'اصلاح', 'به جاش', 'بجاش'])) return 'update';
    if (referencesPrevious && this.matches(text, ['نه', 'نخیر', 'نمیخوام', 'نمی خوام', 'no', 'nope', 'non', 'nein', 'não', 'no quiero', 'いいえ'])) return 'update';
    if (this.matches(text, ['remind', 'remember me', 'schedule', 'create', 'add', 'set', 'put', 'buy', 'rappelle', 'recuerda', 'recuérdame', 'erinnere', 'ricordami', 'lembra', 'napomni', 'hatırlat', '思い出させて', '提醒', 'ذكرني', 'เตือน', 'ingatkan', 'paalalahanan', 'یادم بنداز', 'یادآوری', 'قرار بده', 'اضافه', 'بساز', 'ثبت کن', 'بخر'])) return 'create';
    return 'unknown';
  }

  private pickPrimaryIntent(intents: ContextualCommand['operation'][], referencesPrevious: boolean): ContextualCommand['operation'] {
    if (intents.includes('cancel')) return 'cancel';
    if (intents.includes('update')) return 'update';
    if (intents.includes('create')) return 'create';
    return referencesPrevious ? 'update' : 'unknown';
  }

  private normalize(input: string): string {
    return input.trim().toLowerCase().replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[’‘`]/g, "'").replace(/‌/g, ' ').replace(/[؟?!،؛,.。]/g, ' ').replace(/\s+/g, ' ');
  }

  private referencesPrevious(text: string): boolean {
    return this.matches(text, ['that', 'it', 'this', 'same', 'previous', 'earlier', 'the last one', 'that one', 'the one before', 'lo mismo', 'eso', 'esa', 'el anterior', 'ça', 'celui-là', 'la même', 'das', 'dasselbe', 'der letzte', 'quello', 'lo stesso', 'isso', 'o mesmo', 'это', 'тот же', 'bunu', 'aynısı', 'それ', '同じ', '这个', '那个', '一样的', 'ذلك', 'نفسه', 'همون', 'همون قبلی', 'همون یکی', 'همین', 'اینو', 'این یکی', 'قبلی', 'اونو', 'اون یکی', 'دوباره', 'باز هم', 'به جاش', 'بجاش', 'همونی که']);
  }

  private extractEntities(text: string): ContextualCommand['entities'] {
    const entities: ContextualCommand['entities'] = {};
    const quantity = text.match(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s*(?:تا|عدد|مورد|بار|x)?(?:\s|$))/i);
    if (quantity) entities.quantity = Number(quantity[1]);
    else {
      const wordQuantity: Record<string, number> = { یک: 1, یه: 1, یکی: 1, دو: 2, سه: 3, چهار: 4, پنج: 5, شش: 6, هفت: 7, هشت: 8, نه: 9, ده: 10 };
      for (const [word, value] of Object.entries(wordQuantity)) {
        if (new RegExp(`(?:^|\\s)${word}(?=\\s*(?:تا|عدد|مورد)?(?:\\s|$))`).test(text)) {
          entities.quantity = value;
          break;
        }
      }
    }
    const time = text.match(/\b([01]?\d|2[0-3])\s*(?::|\.)([0-5]\d)\b/);
    if (time) entities.time = `${time[1].padStart(2, '0')}:${time[2]}`;
    const duration = text.match(/(?:^|\s)(\d{1,3})\s*(?:min|mins|minute|minutes|دقیقه)(?=\s|$)/i);
    if (duration) entities.durationMinutes = Number(duration[1]);
    const relative = text.match(/(?:^|\s)(\d{1,3})\s*(?:min|mins|minute|minutes|دقیقه)\s*(?:بعد|دیگه|later|from now|dans|später|dopo|depois)(?=\s|$)/i);
    if (relative) entities.relativeMinutes = Number(relative[1]);
    if (this.matches(text, ['اول', 'اولی', 'first', 'premier', 'erste', 'primo', 'первый', 'birinci', '一番目', '第一个'])) entities.ordinal = 1;
    else if (this.matches(text, ['دوم', 'دومی', 'second', 'deuxième', 'zweite', 'secondo', 'второй', 'ikinci', '二番目', '第二个'])) entities.ordinal = 2;
    else if (this.matches(text, ['سوم', 'سومی', 'third', 'troisième', 'dritte', 'terzo', 'третий', 'üçüncü', '三番目', '第三个'])) entities.ordinal = 3;
    if (this.matches(text, ['امروز', 'today', "aujourd'hui", 'hoy', 'heute', 'oggi', 'hoje', 'сегодня', 'bugün', '今日', '今天', 'اليوم'])) entities.date = 'today';
    else if (this.matches(text, ['فردا', 'tomorrow', 'demain', 'mañana', 'morgen', 'domani', 'amanhã', 'завтра', 'yarın', '明日', '明天', 'غدًا'])) entities.date = 'tomorrow';
    else if (this.matches(text, ['پس فردا', 'پس‌فردا', 'day after tomorrow', 'après-demain', 'pasado mañana', 'übermorgen', 'dopodomani', 'depois de amanhã', 'послезавтра', 'öбür gün', '明後日', '后天', 'بعد غد'])) entities.date = 'day_after_tomorrow';
    if (this.matches(text, ['نه', 'نخیر', 'نه ممنون', 'نمیخوام', 'نمی خوام', 'no', 'nope', 'non', 'nein', 'não', 'no quiero', 'нет', 'いいえ', '不'])) entities.confirmation = 'no';
    else if (this.matches(text, ['بله', 'آره', 'اره', 'حتما', 'باشه', 'اوکی', 'yes', 'sure', 'oui', 'ja', 'sim', 'sí', 'да', 'はい', '好'])) entities.confirmation = 'yes';
    if (this.matches(text, ['نه', 'بدون', 'نذار', 'نمیخوام', 'نمی خوام', 'without', 'without any', 'sin', 'sans', 'ohne', 'senza', 'sem', 'без', 'olmadan', 'なし', '不含', 'do not', "don't", 'does not', 'did not'])) entities.negated = true;
    return entities;
  }

  private splitClauses(text: string): string[] {
    return splitMultilingualClauses(text);
  }

  private detectContradictions(text: string, intents: ContextualCommand['operation'][], entities: ContextualCommand['entities']): string[] {
    const issues: string[] = [];
    if (intents.includes('cancel') && intents.includes('create')) issues.push('create_and_cancel_same_turn');
    if (entities.negated && intents.includes('create')) issues.push('negation_create_ambiguity');
    return issues;
  }

  private scoreConfidence(text: string, referencesPrevious: boolean, operation: ContextualCommand['operation'], entities: ContextualCommand['entities'], contradictions: string[]): number {
    let score = operation === 'unknown' ? 0.35 : 0.65;
    if (text.length > 3) score += 0.05;
    if (referencesPrevious) score += 0.1;
    if (Object.keys(entities).length) score += 0.1;
    if (contradictions.length) score -= 0.25;
    return Math.max(0.05, Math.min(0.95, Number(score.toFixed(2))));
  }

  private matches(text: string, phrases: string[]): boolean {
    return phrases.some((phrase) => text.includes(phrase));
  }
}
