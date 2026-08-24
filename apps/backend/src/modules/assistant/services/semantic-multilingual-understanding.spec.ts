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

  it('does not force an ambiguous semantic match', () => {
    const result = service.understand('help me later', 'en-US');
    expect(result.intent).toBe('UNKNOWN');
  });

  it('preserves deterministic output for repeated paraphrases', () => {
    const first = service.understand('hilf mir beim abendessen', 'de-DE');
    const second = service.understand('hilf mir beim abendessen', 'de-DE');
    expect(second).toEqual(first);
  });
});
