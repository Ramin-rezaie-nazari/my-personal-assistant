import { Injectable } from '@nestjs/common';

export type LocalIntent =
  | 'ADD_TO_BASKET'
  | 'REMOVE_FROM_BASKET'
  | 'RECOMMEND_MEAL'
  | 'GET_NUTRITION_SUMMARY'
  | 'CREATE_REMINDER'
  | 'UNKNOWN';

export type LocalUnderstanding = {
  intent: LocalIntent;
  entities: Record<string, string | number>;
  confidence: number;
  normalizedText: string;
};

@Injectable()
export class LocalLanguageUnderstandingService {
  understand(input: string): LocalUnderstanding {
    const normalizedText = this.normalize(input);
    const entities: Record<string, string | number> = {};

    const quantity = normalizedText.match(/\b(\d+(?:\.\d+)?)\b/);
    if (quantity) entities.quantity = Number(quantity[1]);

    const food = this.findFood(normalizedText);
    if (food) entities.food = food;

    if (food && this.matches(normalizedText, ['اضافه', 'بذار', 'بگذار', 'خرید', 'سبد', 'add', 'basket'])) {
      return this.result('ADD_TO_BASKET', entities, food ? 0.96 : 0.72, normalizedText);
    }

    if (food && this.matches(normalizedText, ['حذف', 'بردار', 'پاک', 'remove', 'delete'])) {
      return this.result('REMOVE_FROM_BASKET', entities, 0.96, normalizedText);
    }

    if (this.matches(normalizedText, ['چی بخور', 'چه بخور', 'شام', 'غذا پیشنهاد', 'پیشنهاد غذا', 'meal', 'dinner'])) {
      return this.result('RECOMMEND_MEAL', entities, 0.93, normalizedText);
    }

    if (this.matches(normalizedText, ['کالری', 'پروتئین', 'تغذیه امروز', 'nutrition', 'calories', 'protein'])) {
      return this.result('GET_NUTRITION_SUMMARY', entities, 0.94, normalizedText);
    }

    if (this.matches(normalizedText, ['یادم بنداز', 'یادآوری', 'یادآور', 'remind', 'reminder'])) {
      return this.result('CREATE_REMINDER', entities, 0.92, normalizedText);
    }

    return this.result('UNKNOWN', entities, 0, normalizedText);
  }

  private normalize(input: string): string {
    return input.trim().toLowerCase().replace(/[؟?!،؛]/g, ' ').replace(/\s+/g, ' ');
  }

  private findFood(text: string): string | undefined {
    const foods: Record<string, string> = {
      'شیر': 'milk', 'milk': 'milk', 'تخم مرغ': 'eggs', 'تخم‌مرغ': 'eggs', 'eggs': 'eggs',
      'مرغ': 'chicken', 'chicken': 'chicken', 'برنج': 'rice', 'rice': 'rice',
      'ماست': 'yogurt', 'yogurt': 'yogurt', 'نان': 'bread', 'bread': 'bread',
      'موز': 'banana', 'banana': 'banana',
    };
    for (const [phrase, value] of Object.entries(foods)) if (text.includes(phrase)) return value;
    return undefined;
  }

  private matches(text: string, phrases: string[]): boolean {
    return phrases.some((phrase) => text.includes(phrase));
  }

  private result(intent: LocalIntent, entities: Record<string, string | number>, confidence: number, normalizedText: string): LocalUnderstanding {
    return { intent, entities, confidence, normalizedText };
  }
}
