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
  entities: Record<string, string | number | boolean>;
  confidence: number;
  normalizedText: string;
};

@Injectable()
export class LocalLanguageUnderstandingService {
  understand(input: string): LocalUnderstanding {
    const normalizedText = this.normalize(input);
    const entities: Record<string, string | number | boolean> = {};

    const quantity = this.extractQuantity(normalizedText);
    if (quantity !== undefined) entities.quantity = quantity;

    const time = normalizedText.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (time) entities.time = `${time[1].padStart(2, '0')}:${time[2]}`;

    const duration = normalizedText.match(/\b(\d{1,3})\s*(?:دقیقه|min|mins|minute|minutes)\b/i);
    if (duration) entities.durationMinutes = Number(duration[1]);

    const calories = normalizedText.match(/\b(\d{2,5})\s*(?:کالری|cal|calories)\b/i);
    if (calories) entities.calories = Number(calories[1]);

    const food = this.findFood(normalizedText);
    if (food) entities.food = food;

    const reference = this.hasReference(normalizedText);
    if (reference) entities.referencesPrevious = true;

    if (this.matches(normalizedText, ['لغو', 'کنسل', 'باطل', 'حذفش کن', 'بیخیال', 'cancel', 'delete'])) {
      return this.result('CANCEL_REQUEST', entities, reference ? 0.97 : 0.91, normalizedText);
    }

    if (reference && this.matches(normalizedText, ['تغییر', 'عوض', 'کن', 'بکن', 'ویرایش', 'update', 'change'])) {
      return this.result('UPDATE_REQUEST', entities, 0.96, normalizedText);
    }

    if (food && this.matches(normalizedText, ['اضافه', 'بذار', 'بگذار', 'بخر', 'خرید', 'سبد', 'اضافه کن', 'add', 'basket'])) {
      return this.result('ADD_TO_BASKET', entities, 0.96, normalizedText);
    }

    if (food && this.matches(normalizedText, ['حذف', 'بردار', 'پاک', 'remove', 'delete'])) {
      return this.result('REMOVE_FROM_BASKET', entities, 0.96, normalizedText);
    }

    if (this.matches(normalizedText, ['یادم بنداز', 'یادآوری', 'یادآور', 'یادم نره', 'یادآوری کن', 'remind', 'reminder'])) {
      return this.result('CREATE_REMINDER', entities, time ? 0.96 : 0.90, normalizedText);
    }

    if (this.matches(normalizedText, ['چی بخور', 'چه بخور', 'شام', 'ناهار', 'صبحانه', 'غذا پیشنهاد', 'پیشنهاد غذا', 'غذا چی', 'meal', 'dinner', 'lunch'])) {
      return this.result('RECOMMEND_MEAL', entities, 0.93, normalizedText);
    }

    if (this.matches(normalizedText, ['کالری', 'پروتئین', 'تغذیه امروز', 'درشت مغذی', 'مواد مغذی', 'nutrition', 'calories', 'protein'])) {
      return this.result('GET_NUTRITION_SUMMARY', entities, 0.94, normalizedText);
    }

    return this.result('UNKNOWN', entities, 0, normalizedText);
  }

  private normalize(input: string): string {
    return input.trim().toLowerCase()
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[ۀة]/g, 'ه')
      .replace(/‌/g, ' ').replace(/[؟?!،؛:]/g, ' ').replace(/\s+/g, ' ');
  }

  private extractQuantity(text: string): number | undefined {
    const numeric = text.match(/\b(\d+(?:\.\d+)?)\b/);
    if (numeric) return Number(numeric[1]);
    const words: Record<string, number> = {
      'یک': 1, 'یه': 1, 'یکی': 1, 'دو': 2, 'دوتا': 2, 'سه': 3, 'سه تا': 3,
      'چهار': 4, 'پنج': 5, 'شش': 6, 'هفت': 7, 'هشت': 8, 'نه': 9, 'ده': 10,
    };
    for (const [word, value] of Object.entries(words)) if (new RegExp(`(?:^|\\s)${word}(?:\\s|$)`).test(text)) return value;
    return undefined;
  }

  private findFood(text: string): string | undefined {
    const foods: Record<string, string> = {
      'سینه مرغ': 'chicken', 'ماست کم چرب': 'yogurt', 'تخم مرغ': 'eggs', 'تخم مرغی': 'eggs',
      'شیر': 'milk', 'milk': 'milk', 'تخم‌مرغ': 'eggs', 'eggs': 'eggs', 'مرغ': 'chicken', 'chicken': 'chicken',
      'برنج': 'rice', 'rice': 'rice', 'ماست': 'yogurt', 'yogurt': 'yogurt', 'نان': 'bread', 'bread': 'bread',
      'موز': 'banana', 'banana': 'banana', 'سیب': 'apple', 'apple': 'apple', 'پنیر': 'cheese', 'cheese': 'cheese',
    };
    return Object.entries(foods).sort(([a], [b]) => b.length - a.length).find(([phrase]) => text.includes(phrase))?.[1];
  }

  private hasReference(text: string): boolean {
    return this.matches(text, ['همون', 'همین', 'اینو', 'اونو', 'این یکی', 'اون یکی', 'قبلی', 'دوباره', 'همونی که', 'the previous', 'that one', 'same']);
  }

  private matches(text: string, phrases: string[]): boolean { return phrases.some((phrase) => text.includes(phrase)); }

  private result(intent: LocalIntent, entities: Record<string, string | number | boolean>, confidence: number, normalizedText: string): LocalUnderstanding {
    return { intent, entities, confidence, normalizedText };
  }
}
