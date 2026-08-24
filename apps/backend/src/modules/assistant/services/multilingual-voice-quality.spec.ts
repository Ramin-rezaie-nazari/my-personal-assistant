import {
  LocalLanguageUnderstandingService,
  type SupportedLocalLanguage,
} from './local-language-understanding.service';

type Case = {
  locale: SupportedLocalLanguage;
  input: string;
};

const c = (locale: SupportedLocalLanguage, input: string): Case => ({ locale, input });

const REMINDER_MATRIX: Case[] = [
  c('fa-IR', 'یادم بنداز شام'), c('en-US', 'remind me about dinner'), c('en-GB', 'remind me about dinner'),
  c('es-ES', 'recuérdame cenar'), c('es-MX', 'recuérdame cenar'), c('fr-FR', 'rappelle-moi le dîner'),
  c('de-DE', 'erinnere mich an das Abendessen'), c('it-IT', 'ricordami della cena'), c('pt-BR', 'me lembre do jantar'),
  c('pt-PT', 'lembra-me do jantar'), c('ru-RU', 'напомни мне про ужин'), c('uk-UA', 'нагадай мені про вечерю'),
  c('pl-PL', 'przypomnij mi o kolacji'), c('nl-NL', 'herinner me aan het avondeten'), c('tr-TR', 'akşam yemeğini hatırlat'),
  c('ar-SA', 'ذكرني بالعشاء'), c('he-IL', 'תזכיר לי ארוחת ערב'), c('hi-IN', 'मुझे रात के खाने की याद दिलाओ'),
  c('bn-IN', 'রাতের খাবারের কথা মনে করিয়ে দাও'), c('ur-PK', 'مجھے رات کے کھانے کی یاد دلاؤ'), c('pa-IN', 'ਮੈਨੂੰ ਰਾਤ ਦੇ ਖਾਣੇ ਦੀ ਯਾਦ ਕਰਾਓ'),
  c('gu-IN', 'મને રાત્રિભોજનની યાદ કરાવો'), c('mr-IN', 'मला रात्रीच्या जेवणाची आठवण करून दे'), c('ta-IN', 'இரவு உணவை நினைவூட்டு'),
  c('te-IN', 'రాత్రి భోజనం గుర్తు చేయు'), c('ja-JP', '夕食を思い出させて'), c('ko-KR', '저녁을 알려줘'),
  c('zh-CN', '提醒我晚饭'), c('zh-TW', '提醒我晚餐'), c('vi-VN', 'nhắc tôi ăn tối'), c('th-TH', 'เตือนฉันเรื่องอาหารเย็น'),
  c('id-ID', 'ingatkan saya makan malam'), c('ms-MY', 'ingatkan saya tentang makan malam'), c('fil-PH', 'paalalahanan ako sa hapunan'),
  c('sv-SE', 'påminn mig om middagen'), c('no-NO', 'minn meg på middag'), c('da-DK', 'mind mig om aftensmad'),
  c('fi-FI', 'muistuta minua illallisesta'), c('cs-CZ', 'připomeň mi večeři'), c('sk-SK', 'pripomeň mi večeru'),
  c('hu-HU', 'emlékeztess a vacsorára'), c('ro-RO', 'amintește-mi de cină'), c('bg-BG', 'напомни ми за вечерята'),
  c('el-GR', 'θύμισέ μου το βραδινό'), c('sr-RS', 'подсети ме на вечеру'), c('hr-HR', 'podsjeti me na večeru'),
  c('sl-SI', 'opomni me na večerjo'), c('sw-KE', 'nikumbushe chakula cha jioni'), c('am-ET', 'እራት አስታውሰኝ'),
  c('fa-AF', 'یادم بنداز شام'), c('fa-TJ', 'ба ман хотиррасон кун'),
];

const REPRESENTATIVE_INTENT_MATRIX: Array<Case & { expectedIntent: 'CREATE_REMINDER' | 'RECOMMEND_MEAL' | 'GET_NUTRITION_SUMMARY' | 'ADD_TO_BASKET' | 'CANCEL_REQUEST' }> = [
  { ...c('fa-IR', 'برای شام چی بخورم؟'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('en-US', 'what should I eat for dinner?'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('es-ES', '¿qué debería comer?'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('fr-FR', 'que dois-je manger ?'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('de-DE', 'was soll ich essen?'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('it-IT', 'cosa dovrei mangiare?'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('pt-BR', 'o que devo comer?'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('ru-RU', 'что мне поесть?'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('tr-TR', 'ne yemeliyim?'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('ja-JP', '何を食べればいい？'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('zh-CN', '我该吃什么？'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('ar-SA', 'ماذا آكل؟'), expectedIntent: 'RECOMMEND_MEAL' },
  { ...c('fa-IR', 'کالری امروزمو بگو'), expectedIntent: 'GET_NUTRITION_SUMMARY' },
  { ...c('en-US', 'show me my calories and protein'), expectedIntent: 'GET_NUTRITION_SUMMARY' },
  { ...c('es-ES', 'muéstrame mis calorías y proteínas'), expectedIntent: 'GET_NUTRITION_SUMMARY' },
  { ...c('de-DE', 'zeige mir meine kalorien und mein protein'), expectedIntent: 'GET_NUTRITION_SUMMARY' },
  { ...c('fr-FR', 'montre-moi mes calories et mes protéines'), expectedIntent: 'GET_NUTRITION_SUMMARY' },
  { ...c('fa-IR', 'این مرغ رو بذار تو سبد'), expectedIntent: 'ADD_TO_BASKET' },
  { ...c('en-US', 'add chicken to the basket'), expectedIntent: 'ADD_TO_BASKET' },
  { ...c('es-ES', 'añade pollo al carrito'), expectedIntent: 'ADD_TO_BASKET' },
  { ...c('fr-FR', 'ajoute le poulet au panier'), expectedIntent: 'ADD_TO_BASKET' },
  { ...c('de-DE', 'füge hühnchen zum warenkorb hinzu'), expectedIntent: 'ADD_TO_BASKET' },
  { ...c('ja-JP', '鶏肉をカートに入れて'), expectedIntent: 'ADD_TO_BASKET' },
  { ...c('zh-CN', '把鸡肉放进购物车'), expectedIntent: 'ADD_TO_BASKET' },
  { ...c('fa-IR', 'این مورد رو لغو کن'), expectedIntent: 'CANCEL_REQUEST' },
  { ...c('en-US', 'cancel that'), expectedIntent: 'CANCEL_REQUEST' },
  { ...c('es-ES', 'cancela eso'), expectedIntent: 'CANCEL_REQUEST' },
  { ...c('fr-FR', 'annule ça'), expectedIntent: 'CANCEL_REQUEST' },
  { ...c('de-DE', 'storniere das'), expectedIntent: 'CANCEL_REQUEST' },
  { ...c('ja-JP', 'それをキャンセルして'), expectedIntent: 'CANCEL_REQUEST' },
];

describe('Multilingual voice quality matrix', () => {
  const service = new LocalLanguageUnderstandingService();

  it('recognizes reminder intent for every supported locale', () => {
    expect(REMINDER_MATRIX).toHaveLength(51);
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
      ['fa-IR', 'remind me درباره شام', 'CREATE_REMINDER'], ['es-ES', 'remind me sobre la cena', 'CREATE_REMINDER'],
      ['fr-FR', 'remind me pour le dîner', 'CREATE_REMINDER'], ['de-DE', 'remind me über das Abendessen', 'CREATE_REMINDER'],
      ['ja-JP', 'remind me 夕食', 'CREATE_REMINDER'], ['zh-CN', 'remind me 晚饭', 'CREATE_REMINDER'],
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
      c('fa-IR', 'برای شام چی بخورم؟'), c('en-US', 'what should I eat for dinner?'), c('es-ES', '¿qué como para cenar?'),
      c('fr-FR', 'que manger ce soir ?'), c('de-DE', 'was soll ich zum Abendessen essen?'), c('it-IT', 'cosa mangio per cena?'),
      c('pt-BR', 'o que eu como no jantar?'), c('ru-RU', 'что поесть на ужин?'), c('tr-TR', 'akşam yemeğinde ne yesem?'),
      c('ja-JP', '夕食に何を食べればいい？'), c('zh-CN', '晚饭吃什么？'), c('ar-SA', 'ماذا آكل على العشاء؟'),
    ];
    for (const { locale, input } of recommendationCases) {
      const result = service.understand(input, locale);
      expect(result.language).toBe(locale);
      expect(result.intent).toBe('RECOMMEND_MEAL');
    }
  });
});
