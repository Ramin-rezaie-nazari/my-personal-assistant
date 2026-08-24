import {
  LocalLanguageUnderstandingService,
  type SupportedLocalLanguage,
} from './local-language-understanding.service';
import { SemanticMultilingualUnderstandingService } from './semantic-multilingual-understanding.service';

describe('SemanticMultilingualUnderstandingService', () => {
  const service = new SemanticMultilingualUnderstandingService(
    new LocalLanguageUnderstandingService(),
  );

  it('recovers natural paraphrases beyond exact lexicon phrases', () => {
    const cases: Array<[SupportedLocalLanguage, string, string]> = [
      ['en-US', 'help me choose the dinner', 'RECOMMEND_MEAL'],
      ['en-US', 'dont let me forget my vitamins', 'CREATE_REMINDER'],
      ['fa-IR', 'واسه شام چی پیشنهاد میدی', 'RECOMMEND_MEAL'],
      ['fa-IR', 'نذار یادم بره', 'CREATE_REMINDER'],
      ['es-ES', 'ayúdame a elegir la cena', 'RECOMMEND_MEAL'],
      ['fr-FR', 'aide-moi à choisir le dîner', 'RECOMMEND_MEAL'],
      ['de-DE', 'hilf mir beim abendessen', 'RECOMMEND_MEAL'],
      ['ja-JP', '何を食べよう', 'RECOMMEND_MEAL'],
      ['zh-CN', '别让我忘了', 'CREATE_REMINDER'],
    ];

    for (const [locale, input, expected] of cases) {
      const result = service.understand(input, locale);
      expect(result.language).toBe(locale);
      expect(result.intent).toBe(expected);
      expect(result.confidence).toBeGreaterThanOrEqual(0.72);
    }
  });

  it('splits natural multi-intent utterances into clauses', () => {
    expect(service.splitClauses('remind me tomorrow and add chicken to my basket')).toEqual([
      'remind me tomorrow',
      'add chicken to my basket',
    ]);

    expect(service.splitClauses('یادم بنداز فردا و بعد مرغ رو به سبد اضافه کن')).toEqual([
      'یادم بنداز فردا',
      'بعد مرغ رو به سبد اضافه کن',
    ]);
  });

  it('does not force ambiguous or merely related conversation into an action intent', () => {
    const cases: Array<[string, SupportedLocalLanguage]> = [
      ['help me later', 'en-US'],
      ['maybe dinner later', 'en-US'],
      ['i had dinner yesterday', 'en-US'],
      ['why do reminders exist', 'en-US'],
      ['واسه شام دیروز چی خوردم؟', 'fa-IR'],
      ['من نمی‌خوام امشب چیزی یادآوری بشه', 'fa-IR'],
      ['¿por qué necesito recordatorios?', 'es-ES'],
      ['je parle du dîner, pas pour en demander un', 'fr-FR'],
      ['ich habe gestern zu Abend gegessen', 'de-DE'],
      ['夕食について話しているだけ', 'ja-JP'],
      ['我只是说晚饭，不是让你提醒我', 'zh-CN'],
    ];

    for (const [input, locale] of cases) {
      const result = service.understand(input, locale);
      expect(result.intent).toBe('UNKNOWN');
    }
  });

  it('rejects semantic candidates with no meaningful lexical anchor', () => {
    const unrelated: Array<[string, SupportedLocalLanguage]> = [
      ['help me later', 'en-US'],
      ['tell me a story about the ocean', 'en-US'],
      ['می‌تونی درباره دریا برام توضیح بدی؟', 'fa-IR'],
      ['cuéntame una historia', 'es-ES'],
      ['raconte-moi une histoire', 'fr-FR'],
      ['erzähl mir eine Geschichte', 'de-DE'],
      ['海について話して', 'ja-JP'],
      ['给我讲个故事', 'zh-CN'],
    ];

    for (const [input, locale] of unrelated) {
      expect(service.understand(input, locale).intent).toBe('UNKNOWN');
    }
  });

  it('keeps clear actionable paraphrases intact after semantic hardening', () => {
    const cases: Array<[SupportedLocalLanguage, string, string]> = [
      ['en-US', 'please help me pick something healthy for dinner', 'RECOMMEND_MEAL'],
      ['fa-IR', 'یه غذای سالم برای شام پیشنهاد بده', 'RECOMMEND_MEAL'],
      ['es-ES', 'ayúdame a elegir algo saludable para cenar', 'RECOMMEND_MEAL'],
      ['fr-FR', 'aide-moi à choisir quelque chose de sain pour dîner', 'RECOMMEND_MEAL'],
      ['de-DE', 'hilf mir etwas Gesundes zum Abendessen auszuwählen', 'RECOMMEND_MEAL'],
      ['ja-JP', '健康的な夕食を選ぶのを手伝って', 'RECOMMEND_MEAL'],
      ['zh-CN', '帮我选一个健康的晚饭', 'RECOMMEND_MEAL'],
    ];

    for (const [locale, input, expected] of cases) {
      const result = service.understand(input, locale);
      expect(result.intent).toBe(expected);
      expect(result.confidence).toBeGreaterThanOrEqual(0.72);
    }
  });

  it('preserves deterministic output for repeated paraphrases', () => {
    const first = service.understand('hilf mir beim abendessen', 'de-DE');
    const second = service.understand('hilf mir beim abendessen', 'de-DE');
    expect(second).toEqual(first);
  });
});
