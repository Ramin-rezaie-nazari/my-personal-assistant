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
  source: 'explicit-paraphrase' | 'lexical-repair';
};

type RuntimeLexicon = Partial<Record<Exclude<LocalIntent, 'UNKNOWN'>, readonly string[]>>;

const PARAPHRASES: Partial<Record<SupportedLocalLanguage, Partial<Record<IntentCandidate['intent'], readonly string[]>>>> = {
  'en-US': {
    RECOMMEND_MEAL: ['what can i eat', 'what would be good to eat', 'help me choose dinner', 'give me something healthy to eat'],
    CREATE_REMINDER: ['make sure i remember', 'dont let me forget', 'make sure i do not forget'],
    ADD_TO_BASKET: ['put chicken in my basket', 'add some chicken', 'include chicken in my shopping list'],
    GET_NUTRITION_SUMMARY: ['how did i do on calories', 'what have i eaten today', 'show my nutrition for today'],
    CANCEL_REQUEST: ['forget that', 'never mind that', 'stop that request'],
  },
  'fa-IR': {
    RECOMMEND_MEAL: ['چی خوبه بخورم', 'واسه شام چی پیشنهاد میدی', 'یه غذای سالم پیشنهاد بده'],
    CREATE_REMINDER: ['نذار یادم بره', 'که یادم بمونه'],
    ADD_TO_BASKET: ['مرغ رو بذار تو سبد', 'یه مرغ هم به خرید اضافه کن'],
    GET_NUTRITION_SUMMARY: ['امروز تغذیه‌ام چطور بوده', 'امروز چقدر کالری خوردم'],
    CANCEL_REQUEST: ['بیخیالش', 'اون درخواست رو لغو کن'],
  },
  'es-ES': {
    RECOMMEND_MEAL: ['qué puedo comer', 'ayúdame a elegir la cena'],
    CREATE_REMINDER: ['no dejes que se me olvide', 'recuérdamelo después'],
    ADD_TO_BASKET: ['pon pollo en mi cesta', 'añade pollo a la compra'],
    GET_NUTRITION_SUMMARY: ['cómo voy de calorías', 'cómo va mi nutrición hoy'],
    CANCEL_REQUEST: ['olvida eso', 'deja esa solicitud'],
  },
  'fr-FR': {
    RECOMMEND_MEAL: ['qu est-ce que je peux manger', 'aide-moi à choisir le dîner'],
    CREATE_REMINDER: ['ne me laisse pas oublier', 'rappelle-moi plus tard'],
    ADD_TO_BASKET: ['mets du poulet dans mon panier', 'ajoute du poulet aux courses'],
    GET_NUTRITION_SUMMARY: ['comment vont mes calories', 'montre ma nutrition du jour'],
    CANCEL_REQUEST: ['oublie ça', 'annule cette demande'],
  },
  'de-DE': {
    RECOMMEND_MEAL: ['was kann ich essen', 'hilf mir beim abendessen'],
    CREATE_REMINDER: ['lass mich das nicht vergessen', 'erinnere mich später'],
    ADD_TO_BASKET: ['leg hühnchen in meinen warenkorb', 'füge hühnchen zum einkauf hinzu'],
    GET_NUTRITION_SUMMARY: ['wie sind meine kalorien heute', 'wie sieht meine ernährung heute aus'],
    CANCEL_REQUEST: ['vergiss das', 'brich diese anfrage ab'],
  },
  'ja-JP': {
    RECOMMEND_MEAL: ['何を食べよう', '何かおすすめの食事を教えて'],
    CREATE_REMINDER: ['忘れないようにして', '後で思い出させて'],
    ADD_TO_BASKET: ['鶏肉を買い物に追加して', '鶏肉を買い物かごに入れて'],
    GET_NUTRITION_SUMMARY: ['今日の栄養はどうだった', '今日何カロリー食べた'],
    CANCEL_REQUEST: ['それは忘れて', 'その依頼を取り消して'],
  },
  'zh-CN': {
    RECOMMEND_MEAL: ['我可以吃什么', '帮我选个晚饭'],
    CREATE_REMINDER: ['别让我忘了', '过会儿提醒我'],
    ADD_TO_BASKET: ['把鸡肉加到购物清单', '把鸡肉加入购物车'],
    GET_NUTRITION_SUMMARY: ['我今天吃得怎么样', '告诉我今天的营养情况'],
    CANCEL_REQUEST: ['算了吧', '取消这个请求'],
  },
};

const MAX_SEMANTIC_CONFIDENCE = 0.96;
const MIN_SINGLE_CANDIDATE_SCORE = 0.68;
const MIN_CANDIDATE_MARGIN = 0.12;
const MIN_FUZZY_SCORE = 0.58;
const MIN_CHARACTER_MATCH_SCORE = 0.72;
const MIN_LEXICAL_SEMANTIC_SCORE = 0.64;
const REPAIR_CONFIDENCE = 0.78;

const ACTION_INTENTS: ReadonlySet<Exclude<LocalIntent, 'UNKNOWN'>> = new Set([
  'ADD_TO_BASKET',
  'REMOVE_FROM_BASKET',
  'CREATE_REMINDER',
  'UPDATE_REQUEST',
  'CANCEL_REQUEST',
]);

const NEGATION_MARKERS = [
  'do not', "don't", 'dont', 'never', 'not', 'no',
  'نمی', 'نمیخوام', 'نمی‌خوام', 'نه', 'بدون', 'نذار',
  'no', 'sin', 'sans', 'ne ... pas', 'pas', 'nicht', 'kein',
  'non', 'senza', 'sem', 'без', 'не', 'не хочу', 'не треба',
  'iptal değil', 'değil', 'لا', 'ليس', 'لا أريد', 'אל', 'לא',
  'नहीं', 'मत', 'আমি চাই না', 'না', 'نہیں', 'مانا نمی',
  'キャンセルしない', 'ない', '不要', '不想', '不是', '别', '不',
  '안', '않', '싫어', 'không', 'chưa', 'ไม่', 'jangan', 'tidak',
  'hindi', 'ne', 'ikke', 'ingen', 'ei', 'nincs', 'nu',
];

const NON_ACTION_MARKERS = [
  'why', 'tell me', 'talk about', 'story', 'history', 'yesterday', 'last night', 'i had', 'i ate',
  'درباره', 'چرا', 'دیروز', 'دیشب', 'خوردم', 'خورده بودم', 'فقط',
  'por qué', 'sobre', 'ayer', 'anoche', 'comí',
  'pourquoi', 'à propos', 'hier', 'j ai mangé',
  'warum', 'über', 'gestern', 'ich habe gegessen',
  'なぜ', 'について', '昨日', '食べた',
  '为什么', '关于', '昨天', '吃过', '只是',
  'لماذا', 'عن', 'أمس',
];

@Injectable()
export class SemanticMultilingualUnderstandingService {
  constructor(private readonly lexical: LocalLanguageUnderstandingService) {}

  understand(input: string, preferredLanguage?: string): LocalUnderstanding {
    const base = this.lexical.understand(input, preferredLanguage);
    const explicit = this.rankExplicitParaphrases(base.language, base.normalizedText);
    const explicitSemantic = this.resolveCandidate(explicit, base);
    if (explicitSemantic) return explicitSemantic;

    if (base.intent !== 'UNKNOWN' && this.shouldRefuseBaseIntent(base)) {
      return { ...base, intent: 'UNKNOWN', confidence: 0 };
    }
    if (base.intent !== 'UNKNOWN') return base;

    const lexicalSemantic = this.rankExistingLexiconSemantics(base.language, base.normalizedText);
    const semantic = this.resolveCandidate(lexicalSemantic, base);
    if (semantic) return semantic;

    return this.repairSingleSpeechError(input, preferredLanguage, base);
  }

  splitClauses(input: string): string[] {
    return input
      .split(/\s*(?:and|then|also|plus|و بعدش|و همچنین|بعد|هم|سپس|ثم|然后|之後|之后|それから|そのあと|그리고|또|y luego|ensuite|dann|und dann)\s*/iu)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private shouldRefuseBaseIntent(base: LocalUnderstanding): boolean {
    const text = this.normalize(base.normalizedText);
    if (!text) return false;

    if (ACTION_INTENTS.has(base.intent as Exclude<LocalIntent, 'UNKNOWN'>)) {
      const isNegated = NEGATION_MARKERS.some((marker) => text.includes(this.normalize(marker)));
      if (isNegated && base.intent !== 'CREATE_REMINDER') return true;
      if (isNegated && base.intent === 'CREATE_REMINDER' && !this.isPositiveReminderForm(text)) return true;
    }

    if (base.intent === 'RECOMMEND_MEAL' || base.intent === 'CREATE_REMINDER') {
      if (NON_ACTION_MARKERS.some((marker) => text.includes(this.normalize(marker)))) return true;
    }

    return false;
  }

  private isPositiveReminderForm(text: string): boolean {
    return [
      'dont let me forget', 'do not let me forget', 'make sure i remember',
      'نذار یادم بره', 'که یادم بمونه',
      'no dejes que se me olvide', 'ne me laisse pas oublier',
      'lass mich das nicht vergessen', '忘れないようにして', '别让我忘了',
    ].some((phrase) => text.includes(this.normalize(phrase)));
  }

  private rankExplicitParaphrases(language: SupportedLocalLanguage, normalized: string): IntentCandidate[] {
    const lexicon = PARAPHRASES[language];
    if (!lexicon) return [];
    const candidates: IntentCandidate[] = [];
    for (const [intent, phrases] of Object.entries(lexicon) as Array<[IntentCandidate['intent'], readonly string[]]>) {
      let best = 0;
      for (const phrase of phrases) best = Math.max(best, this.similarity(normalized, this.normalize(phrase)));
      if (best >= 0.42) candidates.push({ intent, score: best, source: 'explicit-paraphrase' });
    }
    return candidates.sort((a, b) => b.score - a.score);
  }

  private rankExistingLexiconSemantics(language: SupportedLocalLanguage, normalized: string): IntentCandidate[] {
    const lexicalApi = this.lexical as unknown as { lexicon?: (language: SupportedLocalLanguage) => RuntimeLexicon };
    const lexicon = lexicalApi.lexicon?.(language);
    if (!lexicon) return [];
    const candidates: IntentCandidate[] = [];
    for (const [intent, phrases] of Object.entries(lexicon) as Array<[IntentCandidate['intent'], readonly string[]]>) {
      let best = 0;
      for (const phrase of phrases) best = Math.max(best, this.lexicalSemanticSimilarity(normalized, this.normalize(phrase)));
      if (best >= MIN_LEXICAL_SEMANTIC_SCORE) candidates.push({ intent, score: best, source: 'lexical-repair' });
    }
    return candidates;
  }

  private lexicalSemanticSimilarity(text: string, phrase: string): number {
    if (!text || !phrase) return 0;
    if (text.includes(phrase)) return 1;
    const textTokens = this.tokens(text);
    const phraseTokens = this.tokens(phrase);
    if (!textTokens.length || !phraseTokens.length) return 0;
    const matched = phraseTokens.filter((phraseToken) => textTokens.some((textToken) => this.tokenSimilarity(textToken, phraseToken)));
    const minimumRequired = Math.min(2, phraseTokens.length);
    if (matched.length < minimumRequired) {
      const cjkLike = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(text + phrase);
      if (!cjkLike || this.characterSimilarity(text, phrase) < 0.84) return 0;
    }
    const coverage = matched.length / phraseTokens.length;
    const inputCoverage = matched.length / Math.max(1, textTokens.length);
    return coverage * 0.75 + inputCoverage * 0.25;
  }

  private tokenSimilarity(a: string, b: string): boolean {
    if (a === b) return true;
    if (a.length < 3 || b.length < 3) return false;
    const max = Math.max(a.length, b.length);
    return 1 - this.levenshtein(a, b) / max >= 0.78;
  }

  private resolveCandidate(candidates: IntentCandidate[], base: LocalUnderstanding): LocalUnderstanding | undefined {
    if (!candidates.length) return undefined;
    const sorted = [...candidates].sort((a, b) => b.score - a.score);
    const best = sorted[0];
    const second = sorted[1];
    const singleCandidateIsStrongEnough = !second && best.score >= MIN_SINGLE_CANDIDATE_SCORE;
    const winnerHasMeaningfulLead = !!second && best.score >= MIN_FUZZY_SCORE && best.score - second.score >= MIN_CANDIDATE_MARGIN;
    if (!singleCandidateIsStrongEnough && !winnerHasMeaningfulLead) return undefined;
    return { ...base, intent: best.intent, confidence: Math.min(MAX_SEMANTIC_CONFIDENCE, 0.72 + best.score * 0.22) };
  }

  private repairSingleSpeechError(input: string, preferredLanguage: string | undefined, base: LocalUnderstanding): LocalUnderstanding {
    const normalized = base.normalizedText;
    if (normalized.length < 4 || normalized.length > 160) return base;
    const seen = new Set<string>();
    for (let index = 0; index < normalized.length; index += 1) {
      const repaired = normalized.slice(0, index) + normalized.slice(index + 1);
      if (seen.has(repaired)) continue;
      seen.add(repaired);
      const result = this.lexical.understand(repaired, preferredLanguage);
      if (result.intent !== 'UNKNOWN') return { ...result, confidence: Math.min(result.confidence, REPAIR_CONFIDENCE) };
    }
    for (let index = 0; index < normalized.length - 1; index += 1) {
      if (normalized[index] === normalized[index + 1]) continue;
      const chars = [...normalized];
      [chars[index], chars[index + 1]] = [chars[index + 1], chars[index]];
      const repaired = chars.join('');
      const result = this.lexical.understand(repaired, preferredLanguage);
      if (result.intent !== 'UNKNOWN') return { ...result, confidence: Math.min(result.confidence, REPAIR_CONFIDENCE) };
    }
    void input;
    return base;
  }

  private similarity(text: string, phrase: string): number {
    if (!text || !phrase) return 0;
    if (text.includes(phrase)) return 1;
    const textTokens = this.tokens(text);
    const phraseTokens = this.tokens(phrase);
    if (!textTokens.length || !phraseTokens.length) return 0;
    const overlap = phraseTokens.filter((token) => textTokens.includes(token)).length;
    if (overlap === 0) return 0;
    const coverage = overlap / phraseTokens.length;
    const reverse = overlap / textTokens.length;
    const tokenScore = coverage * 0.72 + reverse * 0.28;
    if (tokenScore >= MIN_FUZZY_SCORE) return tokenScore;
    const characterScore = this.characterSimilarity(text, phrase);
    return characterScore >= MIN_CHARACTER_MATCH_SCORE ? characterScore : 0;
  }

  private characterSimilarity(text: string, phrase: string): number {
    const max = Math.max(text.length, phrase.length);
    if (!max) return 0;
    return 1 - this.levenshtein(text, phrase) / max;
  }

  private levenshtein(a: string, b: string): number {
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= b.length; j += 1) current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
    }
    return previous[b.length];
  }

  private tokens(value: string): string[] {
    const scriptless = value.replace(/[^\p{L}\p{N}\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]+/gu, ' ');
    return [...new Set(scriptless.split(/\s+/u).filter(Boolean))];
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[ۀة]/g, 'ه').replace(/‌/g, ' ').replace(/\s+/g, ' ');
  }
}
