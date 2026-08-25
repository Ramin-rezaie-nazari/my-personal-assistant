import { Injectable } from '@nestjs/common';

import type { SupportedLocalLanguage } from './local-language-understanding.service';

export type MultilingualConstraint = {
  kind: 'condition' | 'negation' | 'quantity' | 'unit' | 'date' | 'time' | 'duration' | 'budget' | 'diet';
  value: string | number | boolean;
  source: string;
  confidence: number;
};

export type MultilingualConstraintResult = {
  locale: SupportedLocalLanguage;
  constraints: MultilingualConstraint[];
  contradictory: boolean;
  conditional: boolean;
};

const NEGATION: Record<string, readonly string[]> = {
  'en': ['not', "don't", 'dont', 'no', 'never', 'no longer', 'without'],
  'fa': ['نه', 'ن', 'نمی', 'نذار', 'بدون', 'دیگه نمی', 'هرگز'],
  'es': ['no', 'nunca', 'ya no', 'sin'],
  'fr': ['ne', 'pas', 'jamais', 'sans'],
  'de': ['nicht', 'kein', 'nie', 'ohne'],
  'it': ['non', 'mai', 'senza'],
  'pt': ['não', 'nunca', 'sem'],
  'ru': ['не', 'нет', 'никогда', 'без'],
  'tr': ['değil', 'yok', 'asla', 'olmadan'],
  'ar': ['لا', 'ليس', 'أبداً', 'بدون'],
  'ja': ['ない', 'ません', '決して', 'なし'],
  'ko': ['안', '않아', '절대', '없이'],
  'zh': ['不', '没有', '从不', '不要'],
  'hi': ['नहीं', 'कभी नहीं', 'बिना'],
};

const CONDITIONAL: Record<string, readonly string[]> = {
  'en': ['if', 'unless', 'only if', 'when'],
  'fa': ['اگر', 'مگر اینکه', 'فقط اگر', 'وقتی که'],
  'es': ['si', 'a menos que', 'solo si', 'cuando'],
  'fr': ['si', 'sauf si', 'seulement si', 'quand'],
  'de': ['wenn', 'es sei denn', 'nur wenn'],
  'it': ['se', 'a meno che', 'solo se', 'quando'],
  'pt': ['se', 'a menos que', 'somente se', 'quando'],
  'ru': ['если', 'если только не', 'только если', 'когда'],
  'tr': ['eğer', 'olmadıkça', 'yalnızca', 'ne zaman'],
  'ar': ['إذا', 'إلا إذا', 'فقط إذا', 'عندما'],
  'ja': ['もし', 'なら', '場合', 'とき'],
  'ko': ['만약', '않으면', '경우', '때'],
  'zh': ['如果', '除非', '只有当', '当'],
  'hi': ['अगर', 'जब तक नहीं', 'केवल अगर', 'जब'],
};

const UNITS: Record<string, readonly string[]> = {
  gram: ['g', 'gram', 'grams', 'گرم', 'غرام', 'gramo', 'grammes', 'gramm'],
  kilogram: ['kg', 'kilogram', 'kilograms', 'کیلو', 'کیلوگرم', 'kilo', 'kilogramm'],
  milliliter: ['ml', 'milliliter', 'milliliters', 'میلی‌لیتر', 'میلی لیتر', 'mililitro'],
  liter: ['l', 'liter', 'liters', 'لیتر', 'litro'],
  ounce: ['oz', 'ounce', 'ounces'],
  pound: ['lb', 'lbs', 'pound', 'pounds'],
  cup: ['cup', 'cups', 'فنجان', 'پیمانه'],
  piece: ['piece', 'pieces', 'عدد', 'تا', 'عدد'],
};

@Injectable()
export class MultilingualConstraintExtractionService {
  extract(input: string, locale: SupportedLocalLanguage): MultilingualConstraintResult {
    const text = input.trim().toLocaleLowerCase();
    const family = locale.split('-')[0];
    const constraints: MultilingualConstraint[] = [];

    const conditional = this.findAny(text, CONDITIONAL[family] ?? CONDITIONAL.en);
    const negated = this.findAny(text, NEGATION[family] ?? NEGATION.en);
    if (conditional) constraints.push({ kind: 'condition', value: conditional, source: conditional, confidence: 0.94 });
    if (negated) constraints.push({ kind: 'negation', value: true, source: negated, confidence: 0.95 });

    const quantity = text.match(/(?:^|\s)(\d+(?:[.,]\d+)?)(?:\s+|$)/u);
    if (quantity) {
      const value = Number(quantity[1].replace(',', '.'));
      constraints.push({ kind: 'quantity', value, source: quantity[0].trim(), confidence: 0.98 });
      const after = text.slice((quantity.index ?? 0) + quantity[0].length);
      const unit = Object.entries(UNITS).find(([, aliases]) => aliases.some((alias) => after.trimStart().startsWith(alias)));
      if (unit) constraints.push({ kind: 'unit', value: unit[0], source: unit[1].find((alias) => after.trimStart().startsWith(alias))!, confidence: 0.96 });
    }

    const time = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/u);
    if (time) constraints.push({ kind: 'time', value: `${time[1].padStart(2, '0')}:${time[2]}`, source: time[0], confidence: 0.99 });

    const duration = text.match(/\b(\d{1,3})\s*(?:min|mins|minute|minutes|دقیقه|دقایق|分|分鐘|минут|minutos?)\b/u);
    if (duration) constraints.push({ kind: 'duration', value: Number(duration[1]), source: duration[0], confidence: 0.97 });

    const budget = text.match(/(?:under|below|less than|زیر|کمتر از|menos de|moins de|unter)\s*(\d+(?:[.,]\d+)?)/u);
    if (budget) constraints.push({ kind: 'budget', value: Number(budget[1].replace(',', '.')), source: budget[0], confidence: 0.91 });

    const contradictory = this.hasContradiction(text, family);
    return { locale, constraints, contradictory, conditional: Boolean(conditional) };
  }

  private findAny(text: string, phrases: readonly string[]): string | undefined {
    return phrases
      .slice()
      .sort((a, b) => b.length - a.length)
      .find((phrase) => text.includes(phrase));
  }

  private hasContradiction(text: string, family: string): boolean {
    const negation = this.findAny(text, NEGATION[family] ?? NEGATION.en);
    const affirmative = /\b(add|buy|put|اضافه|بخر|añade|ajoute|füge|aggiungi|добавь|ekle|追加|添加|추가)\b/u.test(text);
    const removal = /\b(remove|delete|cancel|حذف|لغو|quita|annule|entferne|rimuovi|удали|çıkar|削除|删除|삭제)\b/u.test(text);
    return Boolean(negation && affirmative && removal);
  }
}
