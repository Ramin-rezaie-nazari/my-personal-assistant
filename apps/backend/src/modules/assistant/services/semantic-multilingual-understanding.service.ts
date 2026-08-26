import { Injectable } from '@nestjs/common';

import {
  LocalLanguageUnderstandingService,
  type LocalIntent,
  type LocalUnderstanding,
  type SupportedLocalLanguage,
} from './local-language-understanding.service';
import { splitMultilingualClauses } from './multilingual-clause-splitter';

type IntentCandidate = {
  intent: Exclude<LocalIntent, 'UNKNOWN'>;
  score: number;
};

const PARAPHRASES: Partial<Record<SupportedLocalLanguage, Partial<Record<IntentCandidate['intent'], readonly string[]>>>> = {
  'en-US': {
    RECOMMEND_MEAL: [
      'what can i eat', 'what would be good to eat', 'help me choose dinner', 'give me something healthy to eat',
      'what should i have', 'what should i have tonight', 'any ideas for dinner', 'dinner ideas', 'what can i have for dinner',
      'what do you suggest for dinner', 'what sounds good to eat', 'what could i eat tonight', 'i need dinner ideas',
      'what can i eat tonight', 'got any meal ideas', 'what should i grab for dinner', 'something good for dinner',
    ],
    CREATE_REMINDER: [
      'make sure i remember', 'remind me later', 'don’t let me forget', 'dont let me forget', 'remind me about it later',
      'can you remind me', 'remind me about that', 'set me a reminder', 'remember this for later',
    ],
    ADD_TO_BASKET: [
      'put chicken in my basket', 'add some chicken', 'include chicken in my shopping list', 'throw chicken in the cart',
      'put that in the cart', 'add that to my basket', 'can you add chicken to the cart', 'i need chicken in the basket',
    ],
    GET_NUTRITION_SUMMARY: [
      'how did i do on calories', 'what have i eaten today', 'show my nutrition for today', 'how am i doing on calories',
      'how are my calories today', 'how much protein did i get today', 'what is my nutrition looking like',
    ],
    CANCEL_REQUEST: ['forget that', 'never mind that', 'stop that request', 'never mind', 'forget it', 'drop that request'],
  },
  'en-GB': {
    RECOMMEND_MEAL: [
      'what can i eat', 'what should i have tonight', 'any ideas for dinner', 'dinner ideas', 'what shall i eat tonight',
      'what do you suggest for dinner', 'what could i have for dinner',
    ],
    CREATE_REMINDER: ['remind me later', 'don’t let me forget', 'dont let me forget', 'can you remind me', 'set me a reminder'],
    ADD_TO_BASKET: ['put chicken in my basket', 'add chicken to the trolley', 'put that in the basket', 'add that to my shopping'],
    GET_NUTRITION_SUMMARY: ['how are my calories today', 'what have i eaten today', 'show my nutrition today', 'how much protein did i get'],
    CANCEL_REQUEST: ['forget that', 'never mind', 'stop that request', 'forget it'],
  },
  'fa-IR': {
    RECOMMEND_MEAL: [
      'چی خوبه بخورم', 'واسه شام چی پیشنهاد میدی', 'یه غذای سالم پیشنهاد بده', 'امشب چی بخورم', 'برای امشب چی درست کنم',
      'شام چی بزنم', 'برای شام چی خوبه', 'یه ایده برای شام بده', 'برای شام چی پیشنهاد میکنی', 'شام چی پیشنهاد میدی',
      'چی درست کنم امشب', 'امشب چی میچسبه', 'چی بخورم امشب', 'یه شام خوب چی هست', 'برای خوردن چی پیشنهاد داری',
    ],
    CREATE_REMINDER: [
      'بعداً یادم بنداز', 'نذار یادم بره', 'که یادم بمونه', 'بعدا یادآوری کن', 'یادآوریش کن', 'برای بعد یادم بنداز',
      'یادت نره بهم یادآوری کنی',
    ],
    ADD_TO_BASKET: [
      'مرغ رو بذار تو سبد', 'یه مرغ هم به خرید اضافه کن', 'مرغ هم بزن تو سبد', 'اینم بذار تو سبد', 'این رو هم به خرید اضافه کن',
      'مرغ بخر و بذار تو سبد',
    ],
    GET_NUTRITION_SUMMARY: [
      'امروز تغذیه‌ام چطور بوده', 'امروز چقدر کالری خوردم', 'کالری امروزم چطوره', 'امروز چقدر پروتئین گرفتم',
      'امروز وضع تغذیه‌ام چطور بوده', 'امروز چقدر خوردم',
    ],
    CANCEL_REQUEST: ['بیخیالش', 'اون درخواست رو لغو کن', 'ولش کن', 'کنسلش کن', 'این رو بیخیال شو'],
  },
  'es-ES': {
    RECOMMEND_MEAL: [
      'qué puedo comer', 'ayúdame a elegir la cena', 'qué ceno hoy', 'qué puedo cenar esta noche', 'ideas para cenar',
      'qué me recomiendas para cenar', 'qué podría comer esta noche', 'dame una idea para la cena',
    ],
    CREATE_REMINDER: ['no dejes que se me olvide', 'recuérdamelo después', 'recuérdame eso luego', 'ponme un recordatorio', 'acuérdame después'],
    ADD_TO_BASKET: ['pon pollo en mi cesta', 'añade pollo a la compra', 'mete pollo en el carrito', 'añade esto al carrito'],
    GET_NUTRITION_SUMMARY: ['cómo voy de calorías', 'cómo va mi nutrición hoy', 'cuántas calorías llevo hoy', 'cuánta proteína llevo hoy'],
    CANCEL_REQUEST: ['olvida eso', 'deja esa solicitud', 'déjalo', 'cancela eso', 'ya no'],
  },
  'es-MX': {
    RECOMMEND_MEAL: ['qué puedo comer', 'qué voy a cenar', 'qué ceno hoy', 'ideas para la cena', 'qué se te antoja para cenar', 'qué me recomiendas de cena'],
    CREATE_REMINDER: ['recuérdamelo al rato', 'no dejes que se me olvide', 'ponme un recordatorio', 'acuérdame después'],
    ADD_TO_BASKET: ['agrega pollo', 'añade pollo al carrito', 'mete eso al carrito', 'pon esto en la canasta'],
    GET_NUTRITION_SUMMARY: ['cómo voy de calorías', 'cómo va mi nutrición', 'cuántas calorías llevo', 'cuánta proteína llevo'],
    CANCEL_REQUEST: ['cancela eso', 'olvídalo', 'déjalo', 'ya no'],
  },
  'fr-FR': {
    RECOMMEND_MEAL: [
      'qu est-ce que je peux manger', 'aide-moi à choisir le dîner', 'qu est-ce que je mange ce soir', 'des idées pour le dîner',
      'que me conseilles-tu pour le dîner', 'je mange quoi ce soir', 'une idée pour dîner',
    ],
    CREATE_REMINDER: ['ne me laisse pas oublier', 'rappelle-moi plus tard', 'tu peux me le rappeler', 'mets-moi un rappel', 'rappelle-moi ça après'],
    ADD_TO_BASKET: ['mets du poulet dans mon panier', 'ajoute du poulet aux courses', 'mets ça dans le panier', 'ajoute ça au panier'],
    GET_NUTRITION_SUMMARY: ['comment vont mes calories', 'montre ma nutrition du jour', 'combien de calories aujourd’hui', 'combien de protéines aujourd’hui'],
    CANCEL_REQUEST: ['oublie ça', 'annule cette demande', 'laisse tomber', 'annule ça', 'finalement non'],
  },
  'de-DE': {
    RECOMMEND_MEAL: [
      'was kann ich essen', 'hilf mir beim abendessen', 'was soll ich heute abend essen', 'ideen fürs abendessen',
      'was empfiehlst du zum abendessen', 'was könnte ich heute essen', 'was gibt es zum abendessen',
    ],
    CREATE_REMINDER: ['lass mich das nicht vergessen', 'erinnere mich später', 'kannst du mich daran erinnern', 'stell mir eine erinnerung', 'erinnere mich daran später'],
    ADD_TO_BASKET: ['leg hühnchen in meinen warenkorb', 'füge hühnchen zum einkauf hinzu', 'pack das in den warenkorb', 'füge das dem warenkorb hinzu'],
    GET_NUTRITION_SUMMARY: ['wie sind meine kalorien heute', 'wie sieht meine ernährung heute aus', 'wie viel protein hatte ich heute', 'wie viele kalorien habe ich heute'],
    CANCEL_REQUEST: ['vergiss das', 'brich diese anfrage ab', 'lass das', 'storniere das', 'nicht mehr'],
  },
  'it-IT': {
    RECOMMEND_MEAL: ['cosa mangio', 'cosa mangio stasera', 'idee per cena', 'cosa mi consigli per cena', 'che cosa potrei mangiare stasera', 'una cena idea'],
    CREATE_REMINDER: ['ricordamelo dopo', 'non farmelo dimenticare', 'puoi ricordarmelo', 'impostami un promemoria', 'ricordami questa cosa più tardi'],
    ADD_TO_BASKET: ['aggiungi del pollo', 'metti il pollo nel carrello', 'aggiungi questo al carrello', 'metti questo nel carrello'],
    GET_NUTRITION_SUMMARY: ['come sono le mie calorie oggi', 'come va la mia alimentazione', 'quante calorie ho oggi', 'quanto proteine ho preso oggi'],
    CANCEL_REQUEST: ['lascia perdere', 'annulla questo', 'dimentica quello', 'non importa', 'cancella la richiesta'],
  },
  'pt-BR': {
    RECOMMEND_MEAL: ['o que eu como', 'o que eu vou comer hoje', 'o que eu faço pra jantar', 'ideias para o jantar', 'o que você sugere pro jantar', 'o que dá pra comer hoje'],
    CREATE_REMINDER: ['me lembra depois', 'não me deixa esquecer', 'pode me lembrar disso', 'me coloca um lembrete', 'me lembra mais tarde'],
    ADD_TO_BASKET: ['adiciona frango', 'coloca frango no carrinho', 'coloca isso no carrinho', 'adiciona isso na cesta'],
    GET_NUTRITION_SUMMARY: ['como estão minhas calorias hoje', 'como foi minha alimentação hoje', 'quantas calorias eu tenho hoje', 'quanto de proteína eu comi'],
    CANCEL_REQUEST: ['deixa pra lá', 'cancela isso', 'esquece isso', 'não importa', 'cancela o pedido'],
  },
  'ru-RU': {
    RECOMMEND_MEAL: ['что поесть', 'что поесть сегодня вечером', 'что приготовить на ужин', 'идеи для ужина', 'что посоветуешь на ужин', 'что можно поесть сегодня'],
    CREATE_REMINDER: ['напомни потом', 'не дай мне забыть', 'напомни мне об этом позже', 'поставь мне напоминание', 'напомни чуть позже'],
    ADD_TO_BASKET: ['добавь курицу', 'положи курицу в корзину', 'добавь это в корзину', 'положи это в корзину'],
    GET_NUTRITION_SUMMARY: ['как у меня с калориями сегодня', 'как сегодня с питанием', 'сколько калорий сегодня', 'сколько белка сегодня'],
    CANCEL_REQUEST: ['забудь это', 'отмени запрос', 'ладно не надо', 'оставь это', 'неважно'],
  },
  'tr-TR': {
    RECOMMEND_MEAL: ['ne yesem', 'bu akşam ne yesem', 'akşam ne pişireyim', 'akşam yemeği fikri', 'akşam için ne önerirsin', 'bugün ne yiyebilirim'],
    CREATE_REMINDER: ['sonra bana hatırlat', 'unutmama yardım et', 'bunu daha sonra hatırlat', 'bana hatırlatıcı kur', 'sonra hatırlat bana'],
    ADD_TO_BASKET: ['tavuk ekle', 'tavuğu sepete koy', 'bunu sepete ekle', 'bunu alışverişe ekle'],
    GET_NUTRITION_SUMMARY: ['bugün kalorilerim nasıl', 'bugünkü beslenmem nasıl', 'bugün kaç kalori aldım', 'bugün ne kadar protein aldım'],
    CANCEL_REQUEST: ['bunu boşver', 'isteği iptal et', 'vazgeçtim', 'bunu iptal et', 'gerek yok'],
  },
  'ja-JP': {
    RECOMMEND_MEAL: ['何を食べよう', '今夜何を食べよう', '夕食は何にしよう', '夕食のアイデアがほしい', '今晩何を食べればいい', '何か食べたいけどおすすめは'],
    CREATE_REMINDER: ['後で思い出させて', '忘れないようにして', 'あとでリマインドして', 'これを後で思い出させて', 'リマインダーを設定して'],
    ADD_TO_BASKET: ['鶏肉を追加して', '鶏肉をカートに入れて', 'これをカートに入れて', 'これも買い物に追加して'],
    GET_NUTRITION_SUMMARY: ['今日のカロリーはどう', '今日の栄養はどう', '今日は何カロリー食べた', '今日はどれくらいタンパク質を取った'],
    CANCEL_REQUEST: ['それは忘れて', 'その依頼を取り消して', 'やっぱりやめて', 'それはキャンセルして', 'もういい'],
  },
  'zh-CN': {
    RECOMMEND_MEAL: ['我可以吃什么', '今晚吃什么', '晚饭吃什么好', '给我一些晚饭建议', '今天吃什么比较好', '有什么吃饭的建议'],
    CREATE_REMINDER: ['过会儿提醒我', '别让我忘了', '晚点提醒我', '帮我设置个提醒', '之后提醒我这件事'],
    ADD_TO_BASKET: ['加点鸡肉', '把鸡肉放进购物车', '把这个放进购物车', '把这个也加到购物清单'],
    GET_NUTRITION_SUMMARY: ['我今天的卡路里怎么样', '我今天吃得怎么样', '今天吃了多少卡路里', '今天吃了多少蛋白质'],
    CANCEL_REQUEST: ['算了吧', '取消这个请求', '忘了它吧', '不用了', '别了'],
  },
  'ar-SA': {
    RECOMMEND_MEAL: ['ماذا آكل', 'ماذا آكل الليلة', 'ماذا نتعشى اليوم', 'أعطني فكرة للعشاء', 'ماذا تقترح للعشاء', 'ماذا يمكنني أن آكل اليوم'],
    CREATE_REMINDER: ['ذكرني لاحقًا', 'لا تدعني أنسى', 'ذكرني بهذا لاحقًا', 'ضع لي تذكيرًا', 'ذكرني بعد قليل'],
    ADD_TO_BASKET: ['أضف دجاجًا', 'ضع الدجاج في السلة', 'أضف هذا إلى السلة', 'ضع هذا في عربة التسوق'],
    GET_NUTRITION_SUMMARY: ['كيف هي سعراتي اليوم', 'كيف كان نظامي الغذائي اليوم', 'كم سعرة أكلت اليوم', 'كم بروتين أخذت اليوم'],
    CANCEL_REQUEST: ['انس ذلك', 'ألغِ الطلب', 'دعها', 'ألغِ هذا', 'لا داعي'],
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

const FILLERS: Partial<Record<SupportedLocalLanguage, readonly string[]>> = {
  'en-US': ['uh', 'um', 'please', 'just', 'hey', 'like'],
  'en-GB': ['uh', 'um', 'please', 'just', 'hey', 'like'],
  'fa-IR': ['لطفاً', 'فقط', 'یه', 'خب', 'راستی'],
  'es-ES': ['por favor', 'solo', 'oye', 'bueno'],
  'es-MX': ['porfa', 'por favor', 'oye', 'pues'],
  'fr-FR': ['s il te plaît', 'sil te plait', 'juste', 'bon'],
  'de-DE': ['bitte', 'einfach', 'also'],
  'it-IT': ['per favore', 'solo', 'allora'],
  'pt-BR': ['por favor', 'só', 'então'],
  'ru-RU': ['пожалуйста', 'просто', 'ну'],
  'tr-TR': ['lütfen', 'sadece', 'yani'],
  'ja-JP': ['お願いします', 'ちょっと', 'えっと'],
  'zh-CN': ['请', '就', '那个', '嗯'],
  'ar-SA': ['من فضلك', 'فقط', 'يعني'],
};

@Injectable()
export class SemanticMultilingualUnderstandingService {
  constructor(private readonly lexical: LocalLanguageUnderstandingService) {}

  understand(input: string, preferredLanguage?: string): LocalUnderstanding {
    const base = this.lexical.understand(input, preferredLanguage);
    const key = `${base.language}::${this.normalize(base.normalizedText)}`;
    const canonicalIntent = CANONICAL_INTENTS[key];
    if (canonicalIntent) return { ...base, intent: canonicalIntent, confidence: Math.max(base.confidence, 0.92) };

    if (base.intent === 'CANCEL_REQUEST') {
      const normalizedForRecovery = this.semanticNormalize(base.normalizedText, base.language);
      const recovery = this.rank(base.language, normalizedForRecovery).find((candidate) => candidate.intent === 'RECOMMEND_MEAL');
      if (recovery && recovery.score >= 0.9) {
        return {
          ...base,
          normalizedText: normalizedForRecovery,
          intent: 'RECOMMEND_MEAL',
          confidence: Math.min(0.96, 0.72 + recovery.score * 0.22),
        };
      }
      return base;
    }

    if (base.intent !== 'UNKNOWN') return base;

    const normalized = this.semanticNormalize(base.normalizedText, base.language);
    const candidates = this.rank(base.language, normalized);
    if (!candidates.length) return base;

    const best = candidates[0];
    const second = candidates[1];

    if (best.score >= 0.78 && (!second || best.score - second.score >= 0.12)) {
      return {
        ...base,
        normalizedText: normalized,
        intent: best.intent,
        confidence: Math.min(0.96, 0.72 + best.score * 0.22),
      };
    }

    return { ...base, normalizedText: normalized };
  }

  splitClauses(input: string): string[] {
    return splitMultilingualClauses(input);
  }

  private rank(language: SupportedLocalLanguage, normalized: string): IntentCandidate[] {
    const lexicon = PARAPHRASES[language];
    if (!lexicon) return [];
    const candidates: IntentCandidate[] = [];
    for (const [intent, phrases] of Object.entries(lexicon) as Array<[IntentCandidate['intent'], readonly string[]]>) {
      let best = 0;
      for (const phrase of phrases) {
        best = Math.max(best, this.similarity(normalized, this.semanticNormalize(phrase, language)));
      }
      if (best >= 0.42) candidates.push({ intent, score: best });
    }
    return candidates.sort((a, b) => b.score - a.score);
  }

  private similarity(text: string, phrase: string): number {
    if (!text || !phrase) return 0;
    if (text === phrase) return 1;
    if (text.includes(phrase) || phrase.includes(text)) return Math.max(0.9, Math.min(1, Math.min(text.length, phrase.length) / Math.max(text.length, phrase.length) + 0.15));

    const textTokens = this.tokens(text);
    const phraseTokens = this.tokens(phrase);
    if (!textTokens.length || !phraseTokens.length) return 0;

    const overlap = phraseTokens.filter((token) => textTokens.includes(token)).length;
    const coverage = overlap / phraseTokens.length;
    const reverse = overlap / textTokens.length;
    const orderedOverlap = this.orderedTokenOverlap(textTokens, phraseTokens);
    return coverage * 0.58 + reverse * 0.22 + orderedOverlap * 0.20;
  }

  private orderedTokenOverlap(textTokens: string[], phraseTokens: string[]): number {
    if (!phraseTokens.length) return 0;
    let cursor = 0;
    let hits = 0;
    for (const token of phraseTokens) {
      const index = textTokens.indexOf(token, cursor);
      if (index >= cursor) {
        hits += 1;
        cursor = index + 1;
      }
    }
    return hits / phraseTokens.length;
  }

  private tokens(value: string): string[] {
    const scriptless = value.replace(/[^\p{L}\p{N}\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]+/gu, ' ');
    return [...new Set(scriptless.split(/\s+/u).filter(Boolean))];
  }

  private semanticNormalize(value: string, language: SupportedLocalLanguage): string {
    let normalized = this.normalize(value);
    if (language === 'en-US' || language === 'en-GB') {
      normalized = normalized
        .replace(/\bwhat's\b/g, 'what is')
        .replace(/\bwhat'd\b/g, 'what did')
        .replace(/\bi'm\b/g, 'i am')
        .replace(/\bi'd\b/g, 'i would')
        .replace(/\bi'll\b/g, 'i will')
        .replace(/\bcan't\b/g, 'cannot')
        .replace(/\bwon't\b/g, 'will not')
        .replace(/\bdon't\b/g, 'do not');
    }

    for (const filler of FILLERS[language] ?? []) {
      normalized = normalized.replace(new RegExp(`(^|\\s)${this.escapeRegExp(this.normalize(filler))}(?=\\s|$)`, 'giu'), ' ');
    }

    return normalized.replace(/\s+/g, ' ').trim();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalize(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[ۀة]/g, 'ه')
      .replace(/‌/g, ' ')
      .replace(/[؟?!،؛,.]/g, ' ')
      .replace(/\s+/g, ' ');
  }
}
