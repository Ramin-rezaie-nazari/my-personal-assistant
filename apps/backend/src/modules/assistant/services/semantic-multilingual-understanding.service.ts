import { Injectable } from '@nestjs/common';

import {
  LocalLanguageUnderstandingService,
  type LocalIntent,
  type LocalUnderstanding,
  type SupportedLocalLanguage,
} from './local-language-understanding.service';

type IntentCandidate = {
  intent: Exclude<LocalIntent, 'UNKNOWN'>;
  score: number;
  source: 'explicit-paraphrase' | 'lexicon-fuzzy';
};

const PARAPHRASES: Partial<
  Record<
    SupportedLocalLanguage,
    Partial<Record<IntentCandidate['intent'], readonly string[]>>
  >
> = {
  'en-US': {
    RECOMMEND_MEAL: [
      'what can i eat',
      'what would be good to eat',
      'help me choose dinner',
      'give me something healthy to eat',
    ],
    CREATE_REMINDER: [
      'make sure i remember',
      'dont let me forget',
      'make sure i do not forget',
    ],
    ADD_TO_BASKET: [
      'put chicken in my basket',
      'add some chicken',
      'include chicken in my shopping list',
    ],
    GET_NUTRITION_SUMMARY: [
      'how did i do on calories',
      'what have i eaten today',
      'show my nutrition for today',
    ],
    CANCEL_REQUEST: ['forget that', 'never mind that', 'stop that request'],
  },
  'fa-IR': {
    RECOMMEND_MEAL: [
      'چی خوبه بخورم',
      'واسه شام چی پیشنهاد میدی',
      'یه غذای سالم پیشنهاد بده',
    ],
    CREATE_REMINDER: ['نذار یادم بره', 'که یادم بمونه'],
    ADD_TO_BASKET: ['مرغ رو بذار تو سبد', 'یه مرغ هم به خرید اضافه کن'],
    GET_NUTRITION_SUMMARY: [
      'امروز تغذیه‌ام چطور بوده',
      'امروز چقدر کالری خوردم',
    ],
    CANCEL_REQUEST: ['بیخیالش', 'اون درخواست رو لغو کن'],
  },
  'es-ES': {
    RECOMMEND_MEAL: ['qué puedo comer', 'ayúdame a elegir la cena'],
    CREATE_REMINDER: ['no dejes que se me olvide', 'recuérdamelo después'],
    ADD_TO_BASKET: ['pon pollo en mi cesta', 'añade pollo a la compra'],
    GET_NUTRITION_SUMMARY: [
      'cómo voy de calorías',
      'cómo va mi nutrición hoy',
    ],
    CANCEL_REQUEST: ['olvida eso', 'deja esa solicitud'],
  },
  'fr-FR': {
    RECOMMEND_MEAL: [
      'qu est-ce que je peux manger',
      'aide-moi à choisir le dîner',
    ],
    CREATE_REMINDER: ['ne me laisse pas oublier', 'rappelle-moi plus tard'],
    ADD_TO_BASKET: [
      'mets du poulet dans mon panier',
      'ajoute du poulet aux courses',
    ],
    GET_NUTRITION_SUMMARY: [
      'comment vont mes calories',
      'montre ma nutrition du jour',
    ],
    CANCEL_REQUEST: ['oublie ça', 'annule cette demande'],
  },
  'de-DE': {
    RECOMMEND_MEAL: ['was kann ich essen', 'hilf mir beim abendessen'],
    CREATE_REMINDER: ['lass mich das nicht vergessen', 'erinnere mich später'],
    ADD_TO_BASKET: [
      'leg hühnchen in meinen warenkorb',
      'füge hühnchen zum einkauf hinzu',
    ],
    GET_NUTRITION_SUMMARY: [
      'wie sind meine kalorien heute',
      'wie sieht meine ernährung heute aus',
    ],
    CANCEL_REQUEST: ['vergiss das', 'brich diese anfrage ab'],
  },
  'ja-JP': {
    RECOMMEND_MEAL: ['何を食べよう', '何かおすすめの食事を教えて'],
    CREATE_REMINDER: ['忘れないようにして', '後で思い出させて'],
    ADD_TO_BASKET: [
      '鶏肉を買い物に追加して',
      '鶏肉を買い物かごに入れて',
    ],
    GET_NUTRITION_SUMMARY: [
      '今日の栄養はどうだった',
      '今日何カロリー食べた',
    ],
    CANCEL_REQUEST: ['それは忘れて', 'その依頼を取り消して'],
  },
  'zh-CN': {
    RECOMMEND_MEAL: ['我可以吃什么', '帮我选个晚饭'],
    CREATE_REMINDER: ['别让我忘了', '过会儿提醒我'],
    ADD_TO_BASKET: ['把鸡肉加到购物清单', '把鸡肉加入购物车'],
    GET_NUTRITION_SUMMARY: [
      '我今天吃得怎么样',
      '告诉我今天的营养情况',
    ],
    CANCEL_REQUEST: ['算了吧', '取消这个请求'],
  },
};

const MAX_SEMANTIC_CONFIDENCE = 0.96;
const MIN_SINGLE_CANDIDATE_SCORE = 0.68;
const MIN_CANDIDATE_MARGIN = 0.12;
const MIN_FUZZY_SCORE = 0.58;

@Injectable()
export class SemanticMultilingualUnderstandingService {
  constructor(private readonly lexical: LocalLanguageUnderstandingService) {}

  understand(input: string, preferredLanguage?: string): LocalUnderstanding {
    const base = this.lexical.understand(input, preferredLanguage);
    if (base.intent !== 'UNKNOWN') return base;

    const language = base.language;
    const normalized = base.normalizedText;
    const candidates = this.rank(language, normalized);

    if (!candidates.length) return base;

    const best = candidates[0];
    const second = candidates[1];

    // Never convert weak partial overlap into an actionable intent.
    // A single candidate must be strong enough on its own; when there is a
    // runner-up, the winner must also have a meaningful lead.
    const singleCandidateIsStrongEnough =
      !second &&
      best.score >= MIN_SINGLE_CANDIDATE_SCORE;
    const winnerHasMeaningfulLead =
      !!second &&
      best.score >= MIN_FUZZY_SCORE &&
      best.score - second.score >= MIN_CANDIDATE_MARGIN;

    if (!singleCandidateIsStrongEnough && !winnerHasMeaningfulLead) {
      return base;
    }

    return {
      ...base,
      intent: best.intent,
      confidence: Math.min(
        MAX_SEMANTIC_CONFIDENCE,
        0.72 + best.score * 0.22,
      ),
    };
  }

  splitClauses(input: string): string[] {
    return input
      .split(/\s+(?:and|then|also|plus|و|بعد|هم|و بعدش|ثم|و همچنین)\s+/iu)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private rank(
    language: SupportedLocalLanguage,
    normalized: string,
  ): IntentCandidate[] {
    const lexicon = PARAPHRASES[language];
    if (!lexicon) return [];

    const candidates: IntentCandidate[] = [];
    for (const [intent, phrases] of Object.entries(lexicon) as Array<[
      IntentCandidate['intent'],
      readonly string[],
    ]>) {
      let best = 0;
      for (const phrase of phrases) {
        best = Math.max(best, this.similarity(normalized, this.normalize(phrase)));
      }
      if (best >= 0.42) {
        candidates.push({ intent, score: best, source: 'explicit-paraphrase' });
      }
    }
    return candidates.sort((a, b) => b.score - a.score);
  }

  private similarity(text: string, phrase: string): number {
    if (!text || !phrase) return 0;
    if (text.includes(phrase)) return 1;

    const textTokens = this.tokens(text);
    const phraseTokens = this.tokens(phrase);
    if (!textTokens.length || !phraseTokens.length) return 0;

    const overlap = phraseTokens.filter((token) => textTokens.includes(token)).length;
    const coverage = overlap / phraseTokens.length;
    const reverse = overlap / textTokens.length;
    const tokenScore = coverage * 0.72 + reverse * 0.28;

    if (tokenScore < MIN_FUZZY_SCORE) {
      return this.characterSimilarity(text, phrase);
    }
    return tokenScore;
  }

  private characterSimilarity(text: string, phrase: string): number {
    const max = Math.max(text.length, phrase.length);
    if (!max) return 0;
    const distance = this.levenshtein(text, phrase);
    return 1 - distance / max;
  }

  private levenshtein(a: string, b: string): number {
    const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= b.length; j += 1) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      }
      for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
    }
    return previous[b.length];
  }

  private tokens(value: string): string[] {
    const scriptless = value.replace(
      /[^\p{L}\p{N}\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]+/gu,
      ' ',
    );
    return [...new Set(scriptless.split(/\s+/u).filter(Boolean))];
  }

  private normalize(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[ۀة]/g, 'ه')
      .replace(/‌/g, ' ')
      .replace(/\s+/g, ' ');
  }
}
