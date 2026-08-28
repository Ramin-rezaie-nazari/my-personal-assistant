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

  it('covers colloquial and incomplete meal recommendations across representative locale families', () => {
    const cases: Array<[SupportedLocalLanguage, string]> = [
      ['en-US', 'dinner ideas'],
      ['en-GB', 'what shall i eat tonight'],
      ['fa-IR', 'شام چی بزنم'],
      ['es-ES', 'ideas para cenar'],
      ['fr-FR', 'je mange quoi ce soir'],
      ['de-DE', 'was gibt es zum abendessen'],
      ['it-IT', 'idee per cena'],
      ['pt-BR', 'o que eu faço pra jantar'],
      ['ru-RU', 'идеи для ужина'],
      ['tr-TR', 'bu akşam ne yesem'],
      ['ja-JP', '今夜何を食べよう'],
      ['zh-CN', '晚饭吃什么好'],
      ['ar-SA', 'أعطني فكرة للعشاء'],
    ];

    for (const [locale, input] of cases) {
      const result = service.understand(input, locale);
      expect(result.language).toBe(locale);
      expect(result.intent).toBe('RECOMMEND_MEAL');
      expect(result.confidence).toBeGreaterThanOrEqual(0.72);
    }
  });

  it('normalizes spoken fillers and common contractions without weakening intent confidence', () => {
    const cases: Array<[SupportedLocalLanguage, string, string]> = [
      ['en-US', 'uh please what should i eat tonight', 'RECOMMEND_MEAL'],
      ['en-US', "please remind me later, don't let me forget", 'CREATE_REMINDER'],
      ['fa-IR', 'لطفاً خب امشب چی بخورم', 'RECOMMEND_MEAL'],
      ['fr-FR', 's il te plaît, une idée pour dîner', 'RECOMMEND_MEAL'],
      ['de-DE', 'bitte, was gibt es zum abendessen', 'RECOMMEND_MEAL'],
    ];

    for (const [locale, input, expected] of cases) {
      const result = service.understand(input, locale);
      expect(result.language).toBe(locale);
      expect(result.intent).toBe(expected);
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

    expect(service.splitClauses('remind me tomorrow; add chicken to my basket. then tell me calories')).toEqual([
      'remind me tomorrow',
      'add chicken to my basket',
      'tell me calories',
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
