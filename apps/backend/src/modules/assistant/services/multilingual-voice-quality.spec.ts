import {
  LocalLanguageUnderstandingService,
  type SupportedLocalLanguage,
} from './local-language-understanding.service';

type Case = {
  locale: SupportedLocalLanguage;
  input: string;
};

const REMINDER_MATRIX: Case[] = [
  ['fa-IR', 'یادم بنداز شام'],
  ['en-US', 'remind me about dinner'],
  ['en-GB', 'remind me about dinner'],
  ['es-ES', 'recuérdame cenar'],
  ['es-MX', 'recuérdame cenar'],
  ['fr-FR', 'rappelle-moi le dîner'],
  ['de-DE', 'erinnere mich an das Abendessen'],
  ['it-IT', 'ricordami della cena'],
  ['pt-BR', 'me lembre do jantar'],
  ['pt-PT', 'lembra-me do jantar'],
  ['ru-RU', 'напомни мне про ужин'],
  ['uk-UA', 'нагадай мені про вечерю'],
  ['pl-PL', 'przypomnij mi o kolacji'],
  ['nl-NL', 'herinner me aan het avondeten'],
  ['tr-TR', 'akşam yemeğini hatırlat'],
  ['ar-SA', 'ذكرني بالعشاء'],
  ['he-IL', 'תזכיר לי ארוחת ערב'],
  ['hi-IN', 'मुझे रात के खाने की याद दिलाओ'],
  ['bn-IN', 'রাতের খাবারের কথা মনে করিয়ে দাও'],
  ['ur-PK', 'مجھے رات کے کھانے کی یاد دلاؤ'],
  ['pa-IN', 'ਮੈਨੂੰ ਰਾਤ ਦੇ ਖਾਣੇ ਦੀ ਯਾਦ ਕਰਾਓ'],
  ['gu-IN', 'મને રાત્રિભોજનની યાદ કરાવો'],
  ['mr-IN', 'मला रात्रीच्या जेवणाची आठवण करून दे'],
  ['ta-IN', 'இரவு உணவை நினைவூட்டு'],
  ['te-IN', 'రాత్రి భోజనం గుర్తు చేయు'],
  ['ja-JP', '夕食を思い出させて'],
  ['ko-KR', '저녁을 알려줘'],
  ['zh-CN', '提醒我晚饭'],
  ['zh-TW', '提醒我晚餐'],
  ['vi-VN', 'nhắc tôi ăn tối'],
  ['th-TH', 'เตือนฉันเรื่องอาหารเย็น'],
  ['id-ID', 'ingatkan saya makan malam'],
  ['ms-MY', 'ingatkan saya tentang makan malam'],
  ['fil-PH', 'paalalahanan ako sa hapunan'],
  ['sv-SE', 'påminn mig om middagen'],
  ['no-NO', 'minn meg på middag'],
  ['da-DK', 'mind mig om aftensmad'],
  ['fi-FI', 'muistuta minua illallisesta'],
  ['cs-CZ', 'připomeň mi večeři'],
  ['sk-SK', 'pripomeň mi večeru'],
  ['hu-HU', 'emlékeztess a vacsorára'],
  ['ro-RO', 'amintește-mi de cină'],
  ['bg-BG', 'напомни ми за вечерята'],
  ['el-GR', 'θύμισέ μου το βραδινό'],
  ['sr-RS', 'подсети ме на вечеру'],
  ['hr-HR', 'podsjeti me na večeru'],
  ['sl-SI', 'opomni me na večerjo'],
  ['sw-KE', 'nikumbushe chakula cha jioni'],
  ['am-ET', 'እራት አስታውሰኝ'],
  ['fa-AF', 'یادم بنداز شام'],
  ['fa-TJ', 'ба ман хотиррасон кун'],
];

const REPRESENTATIVE_INTENT_MATRIX: Array<
  Case & { expectedIntent: 'CREATE_REMINDER' | 'RECOMMEND_MEAL' | 'GET_NUTRITION_SUMMARY' | 'ADD_TO_BASKET' | 'CANCEL_REQUEST' }
> = [
  { locale: 'fa-IR', input: 'برای شام چی بخورم؟', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'en-US', input: 'what should I eat for dinner?', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'es-ES', input: '¿qué debería comer?', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'fr-FR', input: 'que dois-je manger ?', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'de-DE', input: 'was soll ich essen?', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'it-IT', input: 'cosa dovrei mangiare?', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'pt-BR', input: 'o que devo comer?', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'ru-RU', input: 'что мне поесть?', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'tr-TR', input: 'ne yemeliyim?', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'ja-JP', input: '何を食べればいい？', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'zh-CN', input: '我该吃什么？', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'ar-SA', input: 'ماذا آكل؟', expectedIntent: 'RECOMMEND_MEAL' },
  { locale: 'fa-IR', input: 'کالری امروزمو بگو', expectedIntent: 'GET_NUTRITION_SUMMARY' },
  { locale: 'en-US', input: 'show me my calories and protein', expectedIntent: 'GET_NUTRITION_SUMMARY' },
  { locale: 'es-ES', input: 'muéstrame mis calorías y proteínas', expectedIntent: 'GET_NUTRITION_SUMMARY' },
  { locale: 'de-DE', input: 'zeige mir meine kalorien und mein protein', expectedIntent: 'GET_NUTRITION_SUMMARY' },
  { locale: 'fr-FR', input: 'montre-moi mes calories et mes protéines', expectedIntent: 'GET_NUTRITION_SUMMARY' },
  { locale: 'fa-IR', input: 'این مرغ رو بذار تو سبد', expectedIntent: 'ADD_TO_BASKET' },
  { locale: 'en-US', input: 'add chicken to the basket', expectedIntent: 'ADD_TO_BASKET' },
  { locale: 'es-ES', input: 'añade pollo al carrito', expectedIntent: 'ADD_TO_BASKET' },
  { locale: 'fr-FR', input: 'ajoute le poulet au panier', expectedIntent: 'ADD_TO_BASKET' },
  { locale: 'de-DE', input: 'füge hühnchen zum warenkorb hinzu', expectedIntent: 'ADD_TO_BASKET' },
  { locale: 'ja-JP', input: '鶏肉をカートに入れて', expectedIntent: 'ADD_TO_BASKET' },
  { locale: 'zh-CN', input: '把鸡肉放进购物车', expectedIntent: 'ADD_TO_BASKET' },
  { locale: 'fa-IR', input: 'این مورد رو لغو کن', expectedIntent: 'CANCEL_REQUEST' },
  { locale: 'en-US', input: 'cancel that', expectedIntent: 'CANCEL_REQUEST' },
  { locale: 'es-ES', input: 'cancela eso', expectedIntent: 'CANCEL_REQUEST' },
  { locale: 'fr-FR', input: 'annule ça', expectedIntent: 'CANCEL_REQUEST' },
  { locale: 'de-DE', input: 'storniere das', expectedIntent: 'CANCEL_REQUEST' },
  { locale: 'ja-JP', input: 'それをキャンセルして', expectedIntent: 'CANCEL_REQUEST' },
];

describe('Multilingual voice quality matrix', () => {
  const service = new LocalLanguageUnderstandingService();

  it('recognizes reminder intent for every supported locale', () => {
    expect(REMINDER_MATRIX.length).toBe(52);

    for (const { locale, input } of REMINDER_MATRIX) {
      const result = service.understand(input, locale);

      expect(result.language).toBe(locale);
      expect(result.intent).toBe('CREATE_REMINDER');
      expect(result.confidence).toBeGreaterThanOrEqual(0.84);
      expect(result.languageConfidence).toBeGreaterThanOrEqual(0.8);
      expect(result.normalizedText).toBeTruthy();
      expect(result.entities).toBeDefined();
    }
  });

  it('covers core meal, nutrition, basket, and cancellation intents across multiple scripts', () => {
    for (const { locale, input, expectedIntent } of REPRESENTATIVE_INTENT_MATRIX) {
      const result = service.understand(input, locale);

      expect(result.language).toBe(locale);
      expect(result.intent).toBe(expectedIntent);
      expect(result.confidence).toBeGreaterThanOrEqual(0.84);
      expect(result.languageConfidence).toBeGreaterThanOrEqual(0.8);
      expect(result.normalizedText).toBeTruthy();
      expect(result.entities).toBeDefined();
    }
  });

  it('keeps the preferred locale authoritative during code-switching', () => {
    const cases: Array<[SupportedLocalLanguage, string, string]> = [
      ['fa-IR', 'remind me درباره شام', 'CREATE_REMINDER'],
      ['es-ES', 'remind me sobre la cena', 'CREATE_REMINDER'],
      ['fr-FR', 'remind me pour le dîner', 'CREATE_REMINDER'],
      ['de-DE', 'remind me über das Abendessen', 'CREATE_REMINDER'],
      ['ja-JP', 'remind me 夕食', 'CREATE_REMINDER'],
      ['zh-CN', 'remind me 晚饭', 'CREATE_REMINDER'],
    ];

    for (const [locale, input, expectedIntent] of cases) {
      const result = service.understand(input, locale);
      expect(result.language).toBe(locale);
      expect(result.intent).toBe(expectedIntent);
    }
  });

  it('is deterministic for repeated identical utterances', () => {
    for (const { locale, input } of REMINDER_MATRIX.slice(0, 20)) {
      const first = service.understand(input, locale);
      const second = service.understand(input, locale);
      expect(second).toEqual(first);
    }
  });

  it('does not confuse dinner recommendations with reminders', () => {
    const recommendationCases: Case[] = [
      ['fa-IR', 'برای شام چی بخورم؟'],
      ['en-US', 'what should I eat for dinner?'],
      ['es-ES', '¿qué como para cenar?'],
      ['fr-FR', 'que manger ce soir ?'],
      ['de-DE', 'was soll ich zum Abendessen essen?'],
      ['it-IT', 'cosa mangio per cena?'],
      ['pt-BR', 'o que eu como no jantar?'],
      ['ru-RU', 'что поесть на ужин?'],
      ['tr-TR', 'akşam yemeğinde ne yesem?'],
      ['ja-JP', '夕食に何を食べればいい？'],
      ['zh-CN', '晚饭吃什么？'],
      ['ar-SA', 'ماذا آكل على العشاء؟'],
    ];

    for (const { locale, input } of recommendationCases) {
      const result = service.understand(input, locale);
      expect(result.language).toBe(locale);
      expect(result.intent).toBe('RECOMMEND_MEAL');
    }
  });
});
