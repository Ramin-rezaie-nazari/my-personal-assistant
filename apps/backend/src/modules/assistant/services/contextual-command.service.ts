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
  clauses: string[];
  intents: Array<'create' | 'update' | 'cancel' | 'unknown'>;
  contradictions: string[];
  confidence: number;
};

const MULTILINGUAL_PREVIOUS_REFERENCES: readonly string[] = [
  'that', 'it', 'this', 'same', 'previous', 'earlier', 'the last one',
  'that one', 'the same one', 'again',
  'همون', 'همون قبلی', 'همون یکی', 'همین', 'اینو', 'این یکی', 'قبلی', 'اونو',
  'اون یکی', 'دوباره', 'باز هم', 'به جاش', 'بجاش', 'همونی که',
  'eso', 'esa', 'este', 'esta', 'lo mismo', 'el anterior', 'la anterior',
  'el último', 'la última',
  'ça', 'cela', 'celui-là', 'celle-là', 'le même', 'la même', 'le précédent', 'la précédente',
  'das', 'dies', 'dasselbe', 'der gleiche', 'die gleiche', 'das gleiche', 'das vorherige',
  'quello', 'quella', 'lo stesso', 'la stessa', 'quello precedente',
  'isso', 'isso mesmo', 'o mesmo', 'a mesma', 'o anterior', 'a anterior',
  'это', 'это же', 'то же', 'тот же', 'та же', 'предыдущее', 'предыдущий',
  'це', 'те саме', 'цей', 'ця', 'попереднє', 'попередній',
  'to samo', 'ten sam', 'ta sama', 'poprzedni', 'poprzednia',
  'dat', 'dit', 'hetzelfde', 'dezelfde', 'de vorige',
  'bunu', 'buna', 'aynısı', 'aynı şey', 'önceki',
  'ذلك', 'هذا', 'نفسه', 'نفسها', 'السابق', 'السابقة',
  'זה', 'אותו דבר', 'אותו', 'אותה', 'הקודם', 'הקודמת',
  'वही', 'उसी', 'पिछला', 'पिछली', 'यह', 'वो',
  'ওটাই', 'সেটাই', 'আগেরটা', 'এটা',
  'وہی', 'یہی', 'پچھلا', 'پچھلی',
  'ਉਹੀ', 'ਇਹੀ', 'ਪਿਛਲਾ', 'ਪਿਛਲੀ',
  'એજ', 'આ જ', 'પહેલાનું', 'પહેલાની',
  'तेच', 'हेच', 'मागचे', 'मागची',
  'அதே', 'இதே', 'முந்தையது',
  'అదే', 'ఇదే', 'మునుపటిది',
  'それ', 'それと同じ', '同じもの', '前のもの', 'もう一度',
  '그거', '같은 것', '똑같이', '이전 것', '다시',
  '那个', '同一个', '一样的', '上一个', '之前那个', '再来一次',
  '那個', '同一個', '一樣的', '上一個', '之前那個', '再一次',
  'đó', 'cái đó', 'cùng cái đó', 'cái trước', 'lại lần nữa',
  'นั้น', 'อันเดิม', 'อันก่อน', 'อีกครั้ง',
  'itu', 'yang sama', 'yang sebelumnya', 'lagi',
  'itu juga', 'yang sama itu', 'sebelumnya',
  'den', 'samma', 'den förra', 'igen',
  'det', 'det samme', 'den forrige', 'igjen',
  'det samme', 'den samme', 'den forrige', 'igen',
  'sama', 'ang pareho', 'yung nauna', 'ulit',
  'samme', 'den samme', 'den forrige', 'igen',
  'sama', 'det samma', 'den förra', 'igen',
  'se sama', 'stejný', 'stejné', 'předchozí', 'znovu',
  'to isté', 'rovnaké', 'predchádzajúce', 'znova',
  'ugyanaz', 'előző', 'megint',
  'același', 'aceeași', 'precedentul', 'din nou',
  'същото', 'предишното', 'пак',
  'το ίδιο', 'το προηγούμενο', 'ξανά',
  'исти', 'претходни', 'поново',
  'isto', 'isto tako', 'prethodni', 'opet',
  'isto', 'prejšnji', 'znova',
  'hiyo', 'kile kile', 'ya awali', 'tena',
  'ያው', 'ቀድሞውን', 'እንደገና',
  'ҳамон', 'қаблӣ', 'дубора',
];

@Injectable()
export class ContextualCommandService {
  constructor(private readonly context: ConversationContextService) {}

  async resolve(userId: string, text: string): Promise<ContextualCommand> {
    const normalized = this.normalize(text);
    const previous = (await this.context.get(userId)).lastAction;
    const referencesPrevious = this.referencesPrevious(normalized);
    const clauses = this.splitClauses(normalized);
    const intents = clauses.map((clause) =>
      this.detectOperation(clause, referencesPrevious),
    );
    const operation = this.pickPrimaryIntent(intents, referencesPrevious);
    const entities = this.extractEntities(normalized);
    const contradictions = this.detectContradictions(
      normalized,
      intents,
      entities,
    );

    return {
      text,
      referencesPrevious,
      operation,
      targetAction: referencesPrevious ? previous?.action : undefined,
      targetExecutionId: referencesPrevious ? previous?.executionId : undefined,
      targetResourceType: referencesPrevious
        ? previous?.resourceType
        : undefined,
      targetResourceId: referencesPrevious ? previous?.resourceId : undefined,
      entities,
      clauses,
      intents,
      contradictions,
      confidence: this.scoreConfidence(
        normalized,
        referencesPrevious,
        operation,
        entities,
        contradictions,
      ),
    };
  }

  private detectOperation(
    text: string,
    referencesPrevious: boolean,
  ): ContextualCommand['operation'] {
    if (
      this.matches(text, [
        'cancel', 'delete', 'remove', 'لغو', 'حذف', 'پاک کن', 'بردار', 'کنسل', 'بیخیال',
        'cancela', 'annule', 'stornieren', 'storniere', 'annulla', 'annule', '取消', 'キャンセル', '취소',
      ])
    ) return 'cancel';
    if (
      this.matches(text, [
        'change', 'edit', 'move', 'update', 'make it', 'instead', 'تغییر', 'ویرایش', 'جابجا', 'عوض', 'اصلاح', 'به جاش', 'بجاش',
      ])
    ) return 'update';
    if (
      referencesPrevious &&
      this.matches(text, ['نه', 'نخیر', 'نمیخوام', 'نمی خوام', 'no', 'non', 'nein', 'não', 'não quero', 'нет', 'いいえ', '아니', '不'])
    ) return 'update';
    if (
      this.matches(text, [
        'remind', 'schedule', 'create', 'add', 'یادم بنداز', 'یادآوری', 'قرار بده', 'اضافه', 'بساز', 'ثبت کن', 'بخر',
      ])
    ) return 'create';
    return 'unknown';
  }

  private pickPrimaryIntent(
    intents: ContextualCommand['operation'][],
    referencesPrevious: boolean,
  ): ContextualCommand['operation'] {
    if (intents.includes('cancel')) return 'cancel';
    if (intents.includes('update')) return 'update';
    if (intents.includes('create')) return 'create';
    return referencesPrevious ? 'update' : 'unknown';
  }

  private normalize(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/‌/g, ' ')
      .replace(/[؟?!،؛]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private referencesPrevious(text: string): boolean {
    return this.matches(text, MULTILINGUAL_PREVIOUS_REFERENCES);
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
    const relative = text.match(/(?:^|\s)(\d{1,3})\s*(?:min|mins|minute|minutes|دقیقه)\s*(?:بعد|دیگه|later|from now)(?=\s|$)/i);
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

  private splitClauses(text: string): string[] {
    return text
      .split(/\s+(?:و|ولی|اما|بعد|سپس|then|and|but|y luego|ensuite|dann|poi|depois|然后|之后|それから|그리고)\s+/i)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private detectContradictions(text: string, intents: ContextualCommand['operation'][], entities: ContextualCommand['entities']): string[] {
    const issues: string[] = [];
    if (intents.includes('cancel') && intents.includes('create')) issues.push('create_and_cancel_same_turn');
    if (entities.negated && intents.includes('create') && !this.matches(text, ['بدون', 'نذار', 'نمیخوام'])) issues.push('negation_create_ambiguity');
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

  private matches(text: string, phrases: readonly string[]): boolean {
    return phrases.some((phrase) => {
      const normalizedPhrase = this.normalize(phrase);
      if (!normalizedPhrase) return false;
      if (normalizedPhrase.includes(' ')) return text.includes(normalizedPhrase);
      const latinBoundaryWord = /^[A-Za-z0-9._'-]+$/u.test(normalizedPhrase);
      if (latinBoundaryWord && normalizedPhrase.length <= 5) {
        const escaped = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'u').test(text);
      }
      return text.includes(normalizedPhrase);
    });
  }
}
