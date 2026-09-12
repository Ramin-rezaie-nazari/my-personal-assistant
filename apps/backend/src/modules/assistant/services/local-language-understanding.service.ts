import { Injectable } from '@nestjs/common';

export type LocalIntent =
  | 'ADD_TO_BASKET'
  | 'REMOVE_FROM_BASKET'
  | 'RECOMMEND_MEAL'
  | 'GET_NUTRITION_SUMMARY'
  | 'CREATE_REMINDER'
  | 'UPDATE_REQUEST'
  | 'CANCEL_REQUEST'
  | 'UNKNOWN';

export type LocalUnderstanding = {
  intent: LocalIntent;
  entities: Record<string, string | number | boolean | string[]>;
  confidence: number;
  normalizedText: string;
};

@Injectable()
export class LocalLanguageUnderstandingService {
  understand(input: string): LocalUnderstanding {
    const normalizedText = this.normalize(input);
    const entities: Record<string, string | number | boolean | string[]> = {};
    const quantity = this.extractQuantity(normalizedText);
    if (quantity !== undefined) entities.quantity = quantity;
    const householdSize = this.extractHouseholdSize(normalizedText);
    if (householdSize !== undefined) entities.householdSize = householdSize;
    const budget = this.extractBudget(normalizedText);
    if (budget) {
      entities.budgetAmount = budget.amount;
      entities.budgetCurrency = budget.currency;
    }
    const protein = this.extractTargetNumber(normalizedText, ['پروتئین', 'protein']);
    if (protein !== undefined) entities.proteinGrams = protein;
    const time = this.extractTime(normalizedText);
    if (time) entities.time = time;
    const duration = normalizedText.match(/\b(\d{1,3})\s*(?:دقیقه|min|mins|minute|minutes)\b/i);
    if (duration) entities.durationMinutes = Number(duration[1]);
    const calories = this.extractTargetNumber(normalizedText, ['کالری', 'cal', 'calories']);
    if (calories !== undefined) entities.calories = calories;
    const mealType = this.findMealType(normalizedText);
    if (mealType) entities.mealType = mealType;
    const food = this.findFood(normalizedText);
    if (food) entities.food = food;
    const dietaryPreferences = this.findDietaryPreferences(normalizedText);
    if (dietaryPreferences.length) entities.dietaryPreferences = dietaryPreferences;
    const referencesPrevious = this.hasReference(normalizedText);
    if (referencesPrevious) entities.referencesPrevious = true;
    const negations = this.findNegatedFoods(normalizedText);
    if (negations.length) entities.excludedFoods = negations;
    const allergies = this.findAllergies(normalizedText);
    if (allergies.length) entities.allergies = allergies;

    if (this.matches(normalizedText, ['خودت', 'اتوماتیک', 'هوشمند', 'خودکار', 'automatically', 'smartly']))
      entities.wantsAutomation = true;
    if (this.matches(normalizedText, ['لغو', 'کنسل', 'باطل', 'حذفش کن', 'بیخیال', 'cancel']))
      return this.result('CANCEL_REQUEST', entities, referencesPrevious ? 0.98 : 0.91, normalizedText);
    if (referencesPrevious && this.matches(normalizedText, ['تغییر', 'عوض', 'کن', 'بکن', 'ویرایش', 'به جاش', 'بجاش', 'update', 'change']))
      return this.result('UPDATE_REQUEST', entities, 0.96, normalizedText);
    if (food && this.matches(normalizedText, ['اضافه', 'بذار', 'بگذار', 'بخر', 'خرید', 'سبد', 'اضافه کن', 'add', 'basket']))
      return this.result('ADD_TO_BASKET', entities, 0.97, normalizedText);
    if (food && this.matches(normalizedText, ['حذف', 'بردار', 'پاک', 'remove', 'delete']))
      return this.result('REMOVE_FROM_BASKET', entities, 0.97, normalizedText);
    if (this.matches(normalizedText, ['یادم بنداز', 'یادآوری', 'یادآور', 'یادم نره', 'یادآوری کن', 'remind', 'reminder']))
      return this.result('CREATE_REMINDER', entities, time ? 0.97 : 0.9, normalizedText);
    if (this.matches(normalizedText, ['چی بخور', 'چه بخور', 'شام', 'ناهار', 'صبحانه', 'غذا پیشنهاد', 'پیشنهاد غذا', 'غذا چی', 'meal', 'dinner', 'lunch']))
      return this.result('RECOMMEND_MEAL', entities, 0.94, normalizedText);
    if (this.matches(normalizedText, ['کالری', 'پروتئین', 'تغذیه امروز', 'درشت مغذی', 'مواد مغذی', 'nutrition', 'calories', 'protein']))
      return this.result('GET_NUTRITION_SUMMARY', entities, 0.95, normalizedText);
    return this.result('UNKNOWN', entities, 0, normalizedText);
  }

  private normalize(input: string): string {
    return input.trim().toLowerCase().replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[ۀة]/g, 'ه').replace(/‌/g, ' ').replace(/[؟?!،؛]/g, ' ').replace(/\s+/g, ' ');
  }

  private extractQuantity(text: string): number | undefined {
    const withNumber = text.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:تا|عدد|قطعه|کیلو|گرم|میلی‌?لیتر|ml|kg|g)(?=\s|$)/i);
    if (withNumber) return Number(withNumber[1]);
    const words: Record<string, number> = { یک: 1, یه: 1, یکی: 1, دو: 2, دوتا: 2, سه: 3, 'سه تا': 3, چهار: 4, پنج: 5, شش: 6, هفت: 7, هشت: 8, نه: 9, ده: 10 };
    for (const [word, value] of Object.entries(words)) if (new RegExp(`(?:^|\\s)${word}(?:\\s+(?:تا|عدد))?(?=\\s|$)`).test(text)) return value;
    return undefined;
  }

  private extractHouseholdSize(text: string): number | undefined { const match = text.match(/(?:^|\s)(\d{1,2})\s*(?:نفر|person|people)(?:\s|$)/i); return match ? Number(match[1]) : undefined; }
  private extractBudget(text: string): { amount: number; currency: 'IRR' | 'IRT' | 'USD' | 'EUR' | 'GBP' } | undefined {
    const match = text.match(/(?:بودجه|بودجه ام|حداکثر|حدود|تا سقف|budget|max(?:imum)?)\s*(?:[:=]\s*)?(\d+(?:\.\d+)?)\s*(میلیون|هزار|m|k)?\s*(تومان|تومنی|ریال|irr|irt|دلار|usd|یورو|eur|پوند|gbp)?/i);
    if (!match) return undefined;
    const numeric = Number(match[1]);
    const scale = match[2]?.toLowerCase() === 'میلیون' || match[2]?.toLowerCase() === 'm' ? 1_000_000 : match[2]?.toLowerCase() === 'هزار' || match[2]?.toLowerCase() === 'k' ? 1_000 : 1;
    const rawCurrency = (match[3] ?? 'IRT').toLowerCase();
    const currency = rawCurrency.includes('ریال') || rawCurrency === 'irr' ? 'IRR' : rawCurrency.includes('دلار') || rawCurrency === 'usd' ? 'USD' : rawCurrency.includes('یورو') || rawCurrency === 'eur' ? 'EUR' : rawCurrency.includes('پوند') || rawCurrency === 'gbp' ? 'GBP' : 'IRT';
    return { amount: numeric * scale, currency };
  }
  private extractTargetNumber(text: string, labels: string[]): number | undefined {
    const label = labels.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const afterLabel = text.match(new RegExp(`(?:${label})\\s*(?:[:=]\\s*)?(\\d{1,5}(?:\\.\\d+)?)\\s*(?:گرم|g)?(?=\\s|$)`, 'i'));
    if (afterLabel) return Number(afterLabel[1]);
    const beforeLabel = text.match(new RegExp(`(?:^|\\s)(\\d{1,5}(?:\\.\\d+)?)\\s*(?:${label})(?=\\s|$)`, 'i'));
    return beforeLabel ? Number(beforeLabel[1]) : undefined;
  }
  private extractTime(text: string): string | undefined { const clock = text.match(/(?:^|\s)([01]?\d|2[0-3])\s*(?::|\.)([0-5]\d)(?=\s|$)/); if (clock) return `${clock[1].padStart(2, '0')}:${clock[2]}`; const hour = text.match(/(?:ساعت|at)\s*(\d{1,2})(?=\s|$)/); if (hour && Number(hour[1]) <= 23) return `${hour[1].padStart(2, '0')}:00`; return undefined; }
  private findMealType(text: string): string | undefined { if (this.matches(text, ['صبحانه', 'صبح', 'breakfast'])) return 'breakfast'; if (this.matches(text, ['ناهار', 'ظهر', 'lunch'])) return 'lunch'; if (this.matches(text, ['شام', 'شب', 'dinner'])) return 'dinner'; return undefined; }
  private findFood(text: string): string | undefined { const foods: Record<string, string> = { 'سینه مرغ': 'chicken', 'ماست کم چرب': 'yogurt', 'تخم مرغ': 'eggs', شیر: 'milk', milk: 'milk', 'تخم‌مرغ': 'eggs', eggs: 'eggs', مرغ: 'chicken', chicken: 'chicken', برنج: 'rice', rice: 'rice', ماست: 'yogurt', yogurt: 'yogurt', نان: 'bread', bread: 'bread', موز: 'banana', banana: 'banana', سیب: 'apple', apple: 'apple', پنیر: 'cheese', cheese: 'cheese' }; return Object.entries(foods).sort(([a], [b]) => b.length - a.length).find(([phrase]) => text.includes(phrase))?.[1]; }
  private findDietaryPreferences(text: string): string[] { const preferences: Array<[string, string]> = [['وگان', 'vegan'], ['vegan', 'vegan'], ['گیاهخوار', 'vegetarian'], ['vegetarian', 'vegetarian'], ['بدون گلوتن', 'gluten_free'], ['gluten free', 'gluten_free'], ['کم کربوهیدرات', 'low_carb'], ['low carb', 'low_carb'], ['پر پروتئین', 'high_protein'], ['high protein', 'high_protein']]; return [...new Set(preferences.filter(([phrase]) => text.includes(phrase)).map(([, value]) => value))]; }
  private findNegatedFoods(text: string): string[] { const foods = this.findAllFoods(text); const excluded: string[] = []; for (const [phrase, value] of Object.entries(foods)) { const index = text.indexOf(phrase); if (index >= 0 && this.matches(text.slice(Math.max(0, index - 18), index), ['نه', 'بدون', 'نذار', 'نمیخوام', 'نمی‌خوام', 'no', 'without'])) excluded.push(value); } return [...new Set(excluded)]; }
  private findAllergies(text: string): string[] { const aliases: Array<[string, string]> = [['حساسیت به شیر و لبنیات', 'dairy'], ['حساسیت به شیر', 'milk'], ['حساسیت به لبنیات', 'dairy'], ['حساسیت به تخم مرغ', 'eggs'], ['حساسیت به بادام زمینی', 'peanuts'], ['peanut allergy', 'peanuts'], ['dairy allergy', 'dairy']]; return [...new Set(aliases.filter(([phrase]) => text.includes(phrase)).map(([, value]) => value))]; }
  private findAllFoods(_text: string): Record<string, string> { return { 'سینه مرغ': 'chicken', 'ماست کم چرب': 'yogurt', 'تخم مرغ': 'eggs', شیر: 'milk', مرغ: 'chicken', برنج: 'rice', ماست: 'yogurt', نان: 'bread', موز: 'banana', سیب: 'apple', پنیر: 'cheese' }; }
  private hasReference(text: string): boolean { return this.matches(text, ['همون', 'همین', 'اینو', 'اونو', 'این یکی', 'اون یکی', 'قبلی', 'دوباره', 'همونی که', 'همون که', 'به جاش', 'بجاش', 'the previous', 'that one', 'same']); }
  private matches(text: string, phrases: string[]): boolean { return phrases.some((phrase) => text.includes(phrase)); }
  private result(intent: LocalIntent, entities: Record<string, string | number | boolean | string[]>, confidence: number, normalizedText: string): LocalUnderstanding { return { intent, entities, confidence, normalizedText }; }
}
