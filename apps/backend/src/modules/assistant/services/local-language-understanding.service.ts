import { Injectable } from '@nestjs/common';

export type LocalIntent =
  | 'ADD_TO_BASKET'
  | 'REMOVE_FROM_BASKET'
  | 'RECOMMEND_MEAL'
  | 'RECOMMEND_WORKOUT'
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
    const time = this.extractTime(normalizedText);
    if (time) entities.time = time;
    const duration = normalizedText.match(/\b(\d{1,3})\s*(?:دقیقه|min|mins|minute|minutes)\b/i);
    if (duration) entities.durationMinutes = Number(duration[1]);
    const calories = normalizedText.match(/\b(\d{2,5})\s*(?:کالری|cal|calories)\b/i);
    if (calories) entities.calories = Number(calories[1]);
    const mealType = this.findMealType(normalizedText);
    if (mealType) entities.mealType = mealType;
    const food = this.findFood(normalizedText);
    if (food) entities.food = food;
    const fitnessTargets = this.findFitnessTargets(normalizedText);
    if (fitnessTargets.length) {
      entities.targetAreas = fitnessTargets;
      entities.targetArea = fitnessTargets[0];
    }
    const fitnessDiscipline = this.findFitnessDiscipline(normalizedText);
    if (fitnessDiscipline) entities.discipline = fitnessDiscipline;
    const fitnessEquipment = this.findFitnessEquipment(normalizedText);
    if (fitnessEquipment.length) entities.equipment = fitnessEquipment;
    const difficultyLevel = this.findDifficultyLevel(normalizedText);
    if (difficultyLevel !== undefined) entities.difficultyLevel = difficultyLevel;
    const referencesPrevious = this.hasReference(normalizedText);
    if (referencesPrevious) entities.referencesPrevious = true;
    const negations = this.findNegatedFoods(normalizedText);
    if (negations.length) entities.excludedFoods = negations;
    if (this.matches(normalizedText, ['خودت', 'اتوماتیک', 'هوشمند', 'خودکار', 'automatically', 'smartly'])) entities.wantsAutomation = true;

    if (this.matches(normalizedText, ['لغو', 'کنسل', 'باطل', 'حذفش کن', 'بیخیال', 'cancel']))
      return this.result('CANCEL_REQUEST', entities, referencesPrevious ? 0.98 : 0.91, normalizedText);
    if (referencesPrevious && this.matches(normalizedText, ['تغییر', 'عوض', 'کن', 'بکن', 'ویرایش', 'به جاش', 'بجاش', 'update', 'change']))
      return this.result('UPDATE_REQUEST', entities, 0.96, normalizedText);
    const shoppingRequest = Boolean(food) && this.matches(normalizedText, ['اضافه', 'بذار', 'بگذار', 'بخر', 'خرید', 'سبد', 'اضافه کن', 'add', 'basket']);
    if (shoppingRequest) return this.result('ADD_TO_BASKET', entities, 0.97, normalizedText);
    if (food && this.matches(normalizedText, ['حذف', 'بردار', 'پاک', 'remove', 'delete']))
      return this.result('REMOVE_FROM_BASKET', entities, 0.97, normalizedText);
    const workoutRequest =
      (!shoppingRequest && !food && Boolean(fitnessTargets.length)) ||
      (!shoppingRequest && this.matches(normalizedText, ['تمرین', 'ورزش', 'workout', 'exercise', 'training', 'باشگاه', 'عضله']));
    if (workoutRequest) return this.result('RECOMMEND_WORKOUT', entities, fitnessTargets.length ? 0.97 : 0.88, normalizedText);
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
    const numeric = text.match(/\b(\d+(?:\.\d+)?)\b/);
    if (numeric) return Number(numeric[1]);
    const words: Record<string, number> = { یک: 1, یه: 1, یکی: 1, دو: 2, دوتا: 2, سه: 3, 'سه تا': 3, چهار: 4, پنج: 5, شش: 6, هفت: 7, هشت: 8, نه: 9, ده: 10 };
    for (const [word, value] of Object.entries(words)) if (new RegExp(`(?:^|\\s)${word}(?:\\s|$)`).test(text)) return value;
    return undefined;
  }
  private extractTime(text: string): string | undefined {
    const clock = text.match(/\b([01]?\d|2[0-3])\s*(?::|\.)([0-5]\d)\b/);
    if (clock) return `${clock[1].padStart(2, '0')}:${clock[2]}`;
    const hour = text.match(/(?:ساعت|at)\s*(\d{1,2})\b/);
    if (hour && Number(hour[1]) <= 23) return `${hour[1].padStart(2, '0')}:00`;
    return undefined;
  }
  private findMealType(text: string): string | undefined {
    if (this.matches(text, ['صبحانه', 'صبح', 'breakfast'])) return 'breakfast';
    if (this.matches(text, ['ناهار', 'ظهر', 'lunch'])) return 'lunch';
    if (this.matches(text, ['شام', 'شب', 'dinner'])) return 'dinner';
    return undefined;
  }
  private findFitnessTargets(text: string): string[] {
    const aliases: Array<[string, string[]]> = [
      ['shoulders', ['سرشانه', 'سرشونه', 'شانه', 'شونه', 'shoulder', 'shoulders']],
      ['chest', ['سینه', 'سینه ها', 'سینه‌ها', 'chest']],
      ['back', ['پشت', 'زیربغل', 'زیر بغل', 'back', 'lats', 'lat']],
      ['arms', ['بازو', 'دست', 'دستها', 'دست‌ها', 'arms', 'arm', 'biceps', 'triceps']],
      ['core', ['شکم', 'عضلات شکم', 'abs', 'abdominals', 'core']],
      ['waist', ['کمر', 'waist']],
      ['glutes', ['باسن', 'glute', 'glutes']],
      ['thighs', ['ران', 'رانها', 'ران‌ها', 'thigh', 'thighs']],
      ['legs', ['پا', 'پاها', 'پا‌ها', 'legs', 'leg']],
      ['calves', ['ساق', 'ساق پا', 'calf', 'calves']],
      ['full_body', ['کل بدن', 'تمام بدن', 'فول بادی', 'full body']],
    ];
    return aliases.filter(([, words]) => this.matches(text, words)).map(([value]) => value);
  }
  private findFitnessDiscipline(text: string): string | undefined {
    if (this.matches(text, ['یوگا', 'yoga'])) return 'yoga';
    if (this.matches(text, ['کالیستنیکس', 'calisthenics', 'bodyweight'])) return 'calisthenics';
    if (this.matches(text, ['بدنسازی', 'باشگاه', 'gym', 'weight training'])) return 'gym';
    return undefined;
  }
  private findFitnessEquipment(text: string): string[] {
    const aliases: Array<[string, string[]]> = [
      ['dumbbells', ['دمبل', 'دمبل‌ها', 'دَمبل', 'dumbbell', 'dumbbells']],
      ['barbell', ['هالتر', 'barbell']],
      ['resistance_band', ['کش', 'کش مقاومتی', 'کش تمرینی', 'resistance band', 'band']],
      ['pull_up_bar', ['بارفیکس', 'میله بارفیکس', 'pull up bar', 'pull-up bar']],
      ['bench', ['نیمکت', 'bench']],
      ['cable_machine', ['کابل', 'دستگاه کابل', 'cable', 'cable machine']],
      ['machine', ['دستگاه', 'machine']],
      ['none', ['بدون تجهیزات', 'بدون وسیله', 'بدون ابزار', 'no equipment', 'bodyweight only']],
    ];
    return aliases.filter(([, words]) => this.matches(text, words)).map(([value]) => value);
  }
  private findDifficultyLevel(text: string): number | undefined {
    if (this.matches(text, ['مبتدی', 'beginner', 'beginners'])) return 3;
    if (this.matches(text, ['متوسط', 'نیمه حرفه ای', 'نیمه حرفه‌ای', 'intermediate'])) return 6;
    if (this.matches(text, ['پیشرفته', 'حرفه ای', 'حرفه‌ای', 'advanced'])) return 10;
    return undefined;
  }
  private findFood(text: string): string | undefined {
    const foods: Record<string, string> = { 'سینه مرغ': 'chicken', 'ماست کم چرب': 'yogurt', 'تخم مرغ': 'eggs', شیر: 'milk', milk: 'milk', 'تخم‌مرغ': 'eggs', eggs: 'eggs', مرغ: 'chicken', chicken: 'chicken', برنج: 'rice', rice: 'rice', ماست: 'yogurt', yogurt: 'yogurt', نان: 'bread', bread: 'bread', موز: 'banana', banana: 'banana', سیب: 'apple', apple: 'apple', پنیر: 'cheese', cheese: 'cheese' };
    return Object.entries(foods).sort(([a], [b]) => b.length - a.length).find(([phrase]) => text.includes(phrase))?.[1];
  }
  private findNegatedFoods(text: string): string[] {
    const foods = this.findAllFoods(text); const excluded: string[] = [];
    for (const [phrase, value] of Object.entries(foods)) {
      const index = text.indexOf(phrase);
      if (index >= 0 && this.matches(text.slice(Math.max(0, index - 18), index), ['نه', 'بدون', 'نذار', 'نمیخوام', 'نمی‌خوام', 'no', 'without'])) excluded.push(value);
    }
    return [...new Set(excluded)];
  }
  private findAllFoods(_text: string): Record<string, string> {
    return { 'سینه مرغ': 'chicken', 'ماست کم چرب': 'yogurt', 'تخم مرغ': 'eggs', شیر: 'milk', مرغ: 'chicken', برنج: 'rice', ماست: 'yogurt', نان: 'bread', موز: 'banana', سیب: 'apple', پنیر: 'cheese' };
  }
  private hasReference(text: string): boolean {
    return this.matches(text, ['همون', 'همین', 'اینو', 'اونو', 'این یکی', 'اون یکی', 'قبلی', 'دوباره', 'همونی که', 'همون که', 'به جاش', 'بجاش', 'the previous', 'that one', 'same']);
  }
  private matches(text: string, phrases: string[]): boolean { return phrases.some((phrase) => text.includes(phrase)); }
  private result(intent: LocalIntent, entities: Record<string, string | number | boolean | string[]>, confidence: number, normalizedText: string): LocalUnderstanding { return { intent, entities, confidence, normalizedText }; }
}
