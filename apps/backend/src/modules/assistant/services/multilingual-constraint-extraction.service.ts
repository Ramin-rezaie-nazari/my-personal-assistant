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
  en: ['no longer', 'only not', "don't", 'do not', 'does not', 'did not', 'not', 'never', 'without', 'no'],
  fa: ['دیگه نمی', 'مگر نه', 'نذار', 'نکن', 'نکنید', 'هرگز', 'بدون', 'نمی', 'نه'],
  es: ['ya no', 'a menos que no', 'nunca', 'sin', 'no'],
  fr: ['ne ... pas', 'ne', 'pas', 'jamais', 'sans'],
  de: ['nicht mehr', 'nicht', 'kein', 'nie', 'ohne'],
  it: ['non più', 'mai', 'senza', 'non'],
  pt: ['não mais', 'nunca', 'sem', 'não'],
  ru: ['больше не', 'никогда', 'без', 'не', 'нет'],
  uk: ['більше не', 'ніколи', 'без', 'не', 'ні'],
  tr: ['artık değil', 'asla', 'olmadan', 'değil', 'yok'],
  ar: ['لم يعد', 'أبداً', 'بدون', 'لا', 'ليس'],
  he: ['לא עוד', 'לעולם לא', 'בלי', 'לא'],
  ja: ['もう〜ない', 'ない', 'ません', 'しない', 'しません', '追加しない', '決して', 'なし'],
  ko: ['더 이상 안', '않아', '안', '하지 않는다', '절대', '없이'],
  zh: ['不再', '从不', '没有', '不要', '不'],
  hi: ['अब नहीं', 'कभी नहीं', 'बिना', 'नहीं'],
};

const CONDITIONAL: Record<string, readonly string[]> = {
  en: ['only if', 'unless', 'as long as', 'provided that', 'if', 'when'],
  fa: ['مگر اینکه', 'فقط اگر', 'به شرطی که', 'اگر', 'وقتی که'],
  es: ['a menos que', 'solo si', 'siempre que', 'si', 'cuando'],
  fr: ['sauf si', 'seulement si', 'à condition que', 'si', 'quand'],
  de: ['es sei denn', 'nur wenn', 'vorausgesetzt dass', 'wenn'],
  it: ['a meno che', 'solo se', 'a condizione che', 'se', 'quando'],
  pt: ['a menos que', 'somente se', 'desde que', 'se', 'quando'],
  ru: ['если только не', 'только если', 'при условии что', 'если', 'когда'],
  uk: ['якщо тільки не', 'тільки якщо', 'за умови що', 'якщо', 'коли'],
  tr: ['olmadıkça', 'yalnızca', 'şartıyla', 'eğer', 'ne zaman'],
  ar: ['إلا إذا', 'فقط إذا', 'بشرط أن', 'إذا', 'عندما'],
  he: ['אלא אם', 'רק אם', 'בתנאי ש', 'אם', 'כאשר'],
  ja: ['もし', '場合', 'なら', 'とき'],
  ko: ['만약', '경우', '때', '라면'],
  zh: ['除非', '只有当', '只要', '如果', '当'],
  hi: ['जब तक नहीं', 'केवल अगर', 'बशर्ते कि', 'अगर', 'जब'],
};

const UNITS: Record<string, readonly string[]> = {
  gram: ['grams', 'gram', 'g', 'گرم', 'غرام', 'gramo', 'grammes', 'gramm'],
  kilogram: ['kilograms', 'kilogram', 'kg', 'کیلوگرم', 'کیلو', 'kilo', 'kilogramm'],
  milliliter: ['milliliters', 'milliliter', 'ml', 'میلی‌لیتر', 'میلی لیتر', 'mililitro'],
  liter: ['liters', 'liter', 'l', 'لیتر', 'litro', 'リットル', 'L'],
  ounce: ['ounces', 'ounce', 'oz'],
  pound: ['pounds', 'pound', 'lbs', 'lb'],
  cup: ['cups', 'cup', 'فنجان', 'پیمانه', 'taza', 'tasses', 'カップ', '杯'],
  tablespoon: ['tablespoons', 'tablespoon', 'tbsp', 'قاشق غذاخوری', '大さじ'],
  teaspoon: ['teaspoons', 'teaspoon', 'tsp', 'قاشق چای‌خوری', '小さじ'],
  piece: ['pieces', 'piece', 'عدد', 'تا', '個'],
};

const DATE_TERMS: Record<string, readonly string[]> = {
  en: ['the day after tomorrow', 'day after tomorrow', 'tomorrow', 'today', 'yesterday', 'next week', 'next month'],
  fa: ['پس‌فردا', 'پس فردا', 'فردا', 'امروز', 'امشب', 'دیروز', 'هفته بعد', 'ماه بعد'],
  es: ['pasado mañana', 'mañana', 'hoy', 'esta noche', 'ayer', 'la próxima semana', 'el próximo mes'],
  fr: ['après-demain', 'demain', "aujourd’hui", 'ce soir', 'hier', 'la semaine prochaine', 'le mois prochain'],
  de: ['übermorgen', 'morgen', 'heute', 'heute abend', 'gestern', 'nächste woche', 'nächsten monat'],
  it: ['dopodomani', 'domani', 'oggi', 'stasera', 'ieri', 'la prossima settimana', 'il prossimo mese'],
  pt: ['depois de amanhã', 'amanhã', 'hoje', 'esta noite', 'ontem', 'próxima semana', 'próximo mês'],
  ru: ['послезавтра', 'завтра', 'сегодня', 'сегодня вечером', 'вчера', 'на следующей неделе', 'в следующем месяце'],
  tr: ['öbür gün', 'yarın', 'bugün', 'bu akşam', 'dün', 'gelecek hafta', 'gelecek ay'],
  ar: ['بعد غد', 'غداً', 'اليوم', 'الليلة', 'أمس', 'الأسبوع القادم', 'الشهر القادم'],
  ja: ['明後日', '明日', '今日', '今夜', '昨日', '来週', '来月'],
  ko: ['모레', '내일', '오늘', '오늘 밤', '어제', '다음 주', '다음 달'],
  zh: ['后天', '明天', '今天', '今晚', '昨天', '下周', '下个月'],
  hi: ['परसों', 'कल', 'आज', 'आज रात', 'कल', 'अगले सप्ताह', 'अगले महीने'],
};

const DIET_TERMS: Record<string, readonly string[]> = {
  en: ['vegetarian', 'vegan', 'keto', 'halal', 'kosher', 'gluten-free', 'dairy-free', 'low carb', 'high protein'],
  fa: ['گیاهخواری', 'وگان', 'کتو', 'حلال', 'بدون گلوتن', 'بدون لبنیات', 'کم کربوهیدرات', 'پروتئین بالا'],
  es: ['vegetariano', 'vegano', 'keto', 'halal', 'sin gluten', 'sin lácteos', 'bajo en carbohidratos', 'alto en proteína'],
  fr: ['végétarien', 'végane', 'keto', 'halal', 'sans gluten', 'sans produits laitiers', 'pauvre en glucides', 'riche en protéines'],
  de: ['vegetarisch', 'vegan', 'keto', 'halal', 'glutenfrei', 'laktosefrei', 'low carb', 'proteinreich'],
  it: ['vegetariano', 'vegano', 'keto', 'halal', 'senza glutine', 'senza latticini', 'pochi carboidrati', 'alto contenuto proteico'],
  pt: ['vegetariano', 'vegano', 'keto', 'halal', 'sem glúten', 'sem laticínios', 'baixo carboidrato', 'alto teor de proteína'],
  ru: ['вегетарианский', 'веганский', 'кето', 'халяль', 'без глютена', 'без молочных продуктов', 'низкоуглеводный', 'много белка'],
  tr: ['vejetaryen', 'vegan', 'keto', 'helal', 'glutensiz', 'sütsüz', 'düşük karbonhidrat', 'yüksek protein'],
  ar: ['نباتي', 'فيغان', 'كيتو', 'حلال', 'خالٍ من الغلوتين', 'خالٍ من الألبان', 'قليل الكربوهيدرات', 'عالي البروتين'],
  ja: ['ベジタリアン', 'ビーガン', 'ケト', 'ハラール', 'グルテンフリー', '乳製品なし', '低糖質', '高タンパク'],
  ko: ['채식', '비건', '키토', '할랄', '글루텐 프리', '유제품 없음', '저탄수화물', '고단백'],
  zh: ['素食', '纯素', '生酮', '清真', '无麸质', '无乳制品', '低碳水', '高蛋白'],
  hi: ['शाकाहारी', 'वीगन', 'कीटो', 'हलाल', 'ग्लूटेन मुक्त', 'डेयरी मुक्त', 'कम कार्ब', 'उच्च प्रोटीन'],
};

const AFFIRMATIVE = /(?:\b(?:add|buy|put|include|remove|delete|cancel|take out|añade|agrega|quita|elimina|ajoute|retire|füge|entferne|aggiungi|rimuovi|добавь|удали|ekle|çıkar|追加|削除|添加|删除|추가|삭제)\b|اضافه|بخر|بذار|حذف|لغو|اضافه کن|بخر|بردار)/u;
const REMOVAL = /(?:\b(?:remove|delete|cancel|take out|quita|elimina|retire|supprime|entferne|rimuovi|удали|убери|çıkar|削除|删除|삭제)\b|حذف|لغو|بردار|کنسل)/u;
const ADDITION = /(?:\b(?:add|buy|put|include|añade|agrega|ajoute|füge|aggiungi|добавь|ekle|追加|添加|추가)\b|اضافه|بخر|بذار)/u;

@Injectable()
export class MultilingualConstraintExtractionService {
  extract(input: string, locale: SupportedLocalLanguage): MultilingualConstraintResult {
    const text = this.normalizeDigits(input.trim().toLocaleLowerCase());
    const family = locale.split('-')[0];
    const constraints: MultilingualConstraint[] = [];

    const conditional = this.findAny(text, CONDITIONAL[family] ?? CONDITIONAL.en);
    const negated = this.findAny(text, NEGATION[family] ?? NEGATION.en);
    const date = this.findAny(text, DATE_TERMS[family] ?? DATE_TERMS.en);
    const diet = this.findAny(text, DIET_TERMS[family] ?? DIET_TERMS.en);

    if (conditional) constraints.push({ kind: 'condition', value: conditional, source: conditional, confidence: 0.94 });
    if (negated) constraints.push({ kind: 'negation', value: true, source: negated, confidence: 0.95 });
    if (date) constraints.push({ kind: 'date', value: date, source: date, confidence: 0.93 });
    if (diet) constraints.push({ kind: 'diet', value: diet, source: diet, confidence: 0.93 });

    this.extractQuantities(text, constraints);
    this.extractTime(text, constraints);
    this.extractDuration(text, constraints);
    this.extractBudget(text, constraints);

    return {
      locale,
      constraints,
      contradictory: this.hasContradiction(text, family),
      conditional: Boolean(conditional),
    };
  }

  private extractQuantities(text: string, constraints: MultilingualConstraint[]): void {
    const quantityPattern = /(?<![\p{N}.])((?:\d+\s*\/\s*\d+)|(?:\d+(?:[.,]\d+)?))(?![\p{N}.])/gu;
    for (const match of text.matchAll(quantityPattern)) {
      const raw = match[1].trim();
      const value = raw.includes('/')
        ? this.parseFraction(raw)
        : Number(raw.replace(',', '.'));
      if (!Number.isFinite(value)) continue;

      constraints.push({ kind: 'quantity', value, source: raw, confidence: 0.98 });
      const start = (match.index ?? 0) + match[0].length;
      const after = text.slice(start).trimStart();
      const unit = this.findUnit(after);
      if (unit) constraints.push({ kind: 'unit', value: unit.name, source: unit.alias, confidence: 0.96 });
    }
  }

  private extractTime(text: string, constraints: MultilingualConstraint[]): void {
    const time = text.match(/(?:\b|T)([01]?\d|2[0-3])[:.]([0-5]\d)(?:\b|$)/u);
    if (time) constraints.push({ kind: 'time', value: `${time[1].padStart(2, '0')}:${time[2]}`, source: time[0], confidence: 0.99 });
  }

  private extractDuration(text: string, constraints: MultilingualConstraint[]): void {
    const duration = text.match(/\b(\d{1,3})\s*(?:min|mins|minute|minutes|دقیقه|دقایق|分|分鐘|минут|минуты|minutos|minutos?|dakika|دقائق)\b/u);
    if (duration) constraints.push({ kind: 'duration', value: Number(duration[1]), source: duration[0], confidence: 0.97 });
  }

  private extractBudget(text: string, constraints: MultilingualConstraint[]): void {
    const budget = text.match(/(?:under|below|less than|up to|no more than|زیر|کمتر از|حداکثر|menos de|hasta|moins de|jusqu'à|unter|bis zu|weniger als|sotto|fino a|menos de|до|не более|altında|en fazla|أقل من|حتى|未満|以下|低于|少于)\s*(?:[$€£¥₹₽﷼]|usd|eur|gbp|irr|\$|€|£|¥)?\s*(\d+(?:[.,]\d+)?)/u);
    if (budget) constraints.push({ kind: 'budget', value: Number(budget[1].replace(',', '.')), source: budget[0], confidence: 0.91 });
  }

  private findUnit(text: string): { name: string; alias: string } | undefined {
    const entries = Object.entries(UNITS)
      .flatMap(([name, aliases]) => aliases.map((alias) => ({ name, alias })))
      .sort((a, b) => b.alias.length - a.alias.length);
    for (const entry of entries) {
      if (!text.startsWith(entry.alias)) continue;
      const next = text.slice(entry.alias.length);
      if (!next || /^(?:\s|[\p{P}\p{S}]|[\p{L}]|$)/u.test(next)) return entry;
    }
    return undefined;
  }

  private findAny(text: string, phrases: readonly string[]): string | undefined {
    return phrases.slice().sort((a, b) => b.length - a.length).find((phrase) => text.includes(phrase));
  }

  private parseFraction(raw: string): number {
    const [numerator, denominator] = raw.split('/').map((part) => Number(part.trim()));
    return denominator ? numerator / denominator : Number.NaN;
  }

  private normalizeDigits(text: string): string {
    return text.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  }

  private hasContradiction(text: string, family: string): boolean {
    const negation = this.findAny(text, NEGATION[family] ?? NEGATION.en);
    const affirmative = ADDITION.test(text);
    const removal = REMOVAL.test(text);
    if (affirmative && removal) return true;

    if (!negation) return false;
    const negatedAddition = ADDITION.test(text) && /(?:not|don't|dont|do not|نکن|نذار|نمی|no|no añadas|ne.*pas|nicht|non|não|не|追加しない|추가하지)/u.test(text);
    const negatedRemoval = REMOVAL.test(text) && /(?:not|don't|dont|do not|نکن|نمی|no|ne.*pas|nicht|non|não|не|削除しない|삭제하지)/u.test(text);
    return Boolean(negatedAddition && negatedRemoval);
  }
}
