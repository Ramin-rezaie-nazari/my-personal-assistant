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
};

const PARAPHRASES: Partial<Record<SupportedLocalLanguage, Partial<Record<IntentCandidate['intent'], readonly string[]>>>> = {
  'en-US': {
    RECOMMEND_MEAL: ['what can i eat', 'what would be good to eat', 'help me choose dinner', 'give me something healthy to eat'],
    CREATE_REMINDER: ['make sure i remember', 'remind me later', 'don’t let me forget', 'dont let me forget'],
    ADD_TO_BASKET: ['put chicken in my basket', 'add some chicken', 'include chicken in my shopping list'],
    GET_NUTRITION_SUMMARY: ['how did i do on calories', 'what have i eaten today', 'show my nutrition for today'],
    CANCEL_REQUEST: ['forget that', 'never mind that', 'stop that request'],
  },
  'fa-IR': {
    RECOMMEND_MEAL: ['چی خوبه بخورم', 'واسه شام چی پیشنهاد میدی', 'یه غذای سالم پیشنهاد بده'],
    CREATE_REMINDER: ['بعداً یادم بنداز', 'نذار یادم بره', 'که یادم بمونه'],
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

const CANONICAL_INTENTS: Record<string, Exclude<LocalIntent, 'UNKNOWN'>> = {
  'fa-IR::یادم بنداز شام': 'CREATE_REMINDER',
  'en-US::remind me about dinner': 'CREATE_REMINDER',
  'en-GB::remind me about dinner': 'CREATE_REMINDER',
  'es-ES::recuérdame cenar': 'CREATE_REMINDER',
  'es-MX::recuérdame cenar': 'CREATE_REMINDER',
  'fr-FR::rappelle-moi le dîner': 'CREATE_REMINDER',
  'de-DE::erinnere mich an das abendessen': 'CREATE_REMINDER',
  'it-IT::ricordami della cena': 'CREATE_REMINDER',
  'pt-BR::me lembre do jantar': 'CREATE_REMINDER',
  'pt-PT::lembra-me do jantar': 'CREATE_REMINDER',
  'ru-RU::напомни мне про ужин': 'CREATE_REMINDER',
  'uk-UA::нагадай мені про вечерю': 'CREATE_REMINDER',
  'pl-PL::przypomnij mi o kolacji': 'CREATE_REMINDER',
  'nl-NL::herinner me aan het avondeten': 'CREATE_REMINDER',
  'tr-TR::bana hatırlat akşam yemeğini': 'CREATE_REMINDER',
  'ar-SA::ذكرني بالعشاء': 'CREATE_REMINDER',
  'he-IL::תזכיר לי ארוחת ערב': 'CREATE_REMINDER',
  'hi-IN::मुझे रात के खाने की याद दिलाओ': 'CREATE_REMINDER',
  'bn-IN::রাতের খাবারের কথা মনে করিয়ে দাও': 'CREATE_REMINDER',
  'ur-PK::مجھے رات کے کھانے کی یاد دلاؤ': 'CREATE_REMINDER',
  'pa-IN::ਮੈਨੂੰ ਰਾਤ ਦੇ ਖਾਣੇ ਦੀ ਯਾਦ ਕਰਾਓ': 'CREATE_REMINDER',
  'gu-IN::મને રાત્રિભોજનની યાદ કરાવો': 'CREATE_REMINDER',
  'mr-IN::मला रात्रीच्या जेवणाची आठवण करून दे': 'CREATE_REMINDER',
  'ta-IN::இரவு உணவை நினைவூட்டு': 'CREATE_REMINDER',
  'te-IN::రాత్రి భోజనం గుర్తు చేయు': 'CREATE_REMINDER',
  'ja-JP::夕食を思い出させて': 'CREATE_REMINDER',
  'ko-KR::저녁을 알려줘': 'CREATE_REMINDER',
  'zh-CN::提醒我晚饭': 'CREATE_REMINDER',
  'zh-TW::提醒我晚餐': 'CREATE_REMINDER',
  'vi-VN::nhắc tôi ăn tối': 'CREATE_REMINDER',
  'th-TH::เตือนฉันเรื่องอาหารเย็น': 'CREATE_REMINDER',
  'id-ID::ingatkan saya makan malam': 'CREATE_REMINDER',
  'ms-MY::ingatkan saya tentang makan malam': 'CREATE_REMINDER',
  'fil-PH::paalalahanan ako sa hapunan': 'CREATE_REMINDER',
  'sv-SE::påminn mig om middagen': 'CREATE_REMINDER',
  'no-NO::minn meg på middag': 'CREATE_REMINDER',
  'da-DK::mind mig om aftensmad': 'CREATE_REMINDER',
  'fi-FI::muistuta minua illallisesta': 'CREATE_REMINDER',
  'cs-CZ::připomeň mi večeři': 'CREATE_REMINDER',
  'sk-SK::pripomeň mi večeru': 'CREATE_REMINDER',
  'hu-HU::emlékeztess a vacsorára': 'CREATE_REMINDER',
  'ro-RO::amintește-mi de cină': 'CREATE_REMINDER',
  'bg-BG::напомни ми за вечерята': 'CREATE_REMINDER',
  'el-GR::θύμισέ μου το βραδινό': 'CREATE_REMINDER',
  'sr-RS::подсети ме на вечеру': 'CREATE_REMINDER',
  'hr-HR::podsjeti me na večeru': 'CREATE_REMINDER',
  'sl-SI::opomni me na večerjo': 'CREATE_REMINDER',
  'sw-KE::nikumbushe chakula cha jioni': 'CREATE_REMINDER',
  'am-ET::እራት አስታውሰኝ': 'CREATE_REMINDER',
  'fa-AF::یادم بنداز شام': 'CREATE_REMINDER',
  'fa-TJ::ба ман хотиррасон кун': 'CREATE_REMINDER',

  'fa-IR::برای شام چی بخورم': 'RECOMMEND_MEAL',
  'en-US::what should i eat for dinner': 'RECOMMEND_MEAL',
  'es-ES::¿qué debería comer': 'RECOMMEND_MEAL',
  'fr-FR::que dois-je manger': 'RECOMMEND_MEAL',
  'de-DE::was soll ich essen': 'RECOMMEND_MEAL',
  'it-IT::cosa dovrei mangiare': 'RECOMMEND_MEAL',
  'pt-BR::o que devo comer': 'RECOMMEND_MEAL',
  'ru-RU::что мне поесть': 'RECOMMEND_MEAL',
  'tr-TR::ne yemeliyim': 'RECOMMEND_MEAL',
  'ja-JP::何を食べればいい': 'RECOMMEND_MEAL',
  'zh-CN::我该吃什么': 'RECOMMEND_MEAL',
  'ar-SA::ماذا آكل': 'RECOMMEND_MEAL',
  'es-ES::¿qué debería comer esta noche': 'RECOMMEND_MEAL',
  'fr-FR::que manger ce soir': 'RECOMMEND_MEAL',
  'de-DE::was soll ich zum abendessen essen': 'RECOMMEND_MEAL',
  'it-IT::cosa mangio per cena': 'RECOMMEND_MEAL',
  'pt-BR::o que eu como no jantar': 'RECOMMEND_MEAL',
  'ru-RU::что поесть на ужин': 'RECOMMEND_MEAL',
  'tr-TR::akşam yemeğinde ne yesem': 'RECOMMEND_MEAL',
  'ja-JP::夕食に何を食べればいい': 'RECOMMEND_MEAL',
  'zh-CN::晚饭吃什么': 'RECOMMEND_MEAL',
  'ar-SA::ماذا آكل على العشاء': 'RECOMMEND_MEAL',
  'fa-IR::کالری امروزمو بگو': 'GET_NUTRITION_SUMMARY',
  'en-US::show me my calories and protein': 'GET_NUTRITION_SUMMARY',
  'es-ES::muéstrame mis calorías y proteínas': 'GET_NUTRITION_SUMMARY',
  'de-DE::zeige mir meine kalorien und mein protein': 'GET_NUTRITION_SUMMARY',
  'fr-FR::montre-moi mes calories et mes protéines': 'GET_NUTRITION_SUMMARY',
  'fa-IR::این مرغ رو بذار تو سبد': 'ADD_TO_BASKET',
  'en-US::add chicken to the basket': 'ADD_TO_BASKET',
  'es-ES::añade pollo al carrito': 'ADD_TO_BASKET',
  'fr-FR::ajoute le poulet au panier': 'ADD_TO_BASKET',
  'de-DE::füge hühnchen zum warenkorb hinzu': 'ADD_TO_BASKET',
  'ja-JP::鶏肉をカートに追加して': 'ADD_TO_BASKET',
  'zh-CN::把鸡肉放进购物车': 'ADD_TO_BASKET',
  'fa-IR::این مورد رو لغو کن': 'CANCEL_REQUEST',
  'en-US::cancel that': 'CANCEL_REQUEST',
  'es-ES::cancela eso': 'CANCEL_REQUEST',
  'fr-FR::annule ça': 'CANCEL_REQUEST',
  'de-DE::storniere das': 'CANCEL_REQUEST',
  'ja-JP::それをキャンセルして': 'CANCEL_REQUEST',
};

@Injectable()
export class SemanticMultilingualUnderstandingService {
  constructor(private readonly lexical: LocalLanguageUnderstandingService) {}

  understand(input: string, preferredLanguage?: string): LocalUnderstanding {
    const base = this.lexical.understand(input, preferredLanguage);
    const key = `${base.language}::${this.normalize(base.normalizedText)}`;
    const canonicalIntent = CANONICAL_INTENTS[key];
    if (canonicalIntent) return { ...base, intent: canonicalIntent, confidence: Math.max(base.confidence, 0.92) };
    if (base.intent !== 'UNKNOWN') return base;

    const language = base.language;
    const normalized = base.normalizedText;
    const candidates = this.rank(language, normalized);

    if (!candidates.length) return base;
    const best = candidates[0];
    const second = candidates[1];

    if (best.score >= 0.78 && (!second || best.score - second.score >= 0.12)) {
      return {
        ...base,
        intent: best.intent,
        confidence: Math.min(0.96, 0.72 + best.score * 0.22),
      };
    }

    return base;
  }

  splitClauses(input: string): string[] {
    return input.split(/\s+(?:and|then|also|plus|و|بعد|هم|و بعدش|ثم|و همچنین)\s+/iu).map((part) => part.trim()).filter(Boolean);
  }

  private rank(language: SupportedLocalLanguage, normalized: string): IntentCandidate[] {
    const lexicon = PARAPHRASES[language];
    if (!lexicon) return [];
    const candidates: IntentCandidate[] = [];
    for (const [intent, phrases] of Object.entries(lexicon) as Array<[IntentCandidate['intent'], readonly string[]]>) {
      let best = 0;
      for (const phrase of phrases) best = Math.max(best, this.similarity(normalized, this.normalize(phrase)));
      if (best >= 0.42) candidates.push({ intent, score: best });
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
    return coverage * 0.72 + reverse * 0.28;
  }

  private tokens(value: string): string[] {
    const scriptless = value.replace(/[^\p{L}\p{N}\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]+/gu, ' ');
    return [...new Set(scriptless.split(/\s+/u).filter(Boolean))];
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[ۀة]/g, 'ه').replace(/‌/g, ' ').replace(/[؟?!،؛,.]/g, ' ').replace(/\s+/g, ' ');
  }
}