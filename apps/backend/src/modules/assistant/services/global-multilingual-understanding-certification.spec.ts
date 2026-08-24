import {
  LocalLanguageUnderstandingService,
  type SupportedLocalLanguage,
} from './local-language-understanding.service';
import { SemanticMultilingualUnderstandingService } from './semantic-multilingual-understanding.service';

const REMINDERS: Array<[SupportedLocalLanguage, string]> = [
  ['fa-IR', 'یادم بنداز شام'], ['en-US', 'remind me about dinner'], ['en-GB', 'remind me about dinner'],
  ['es-ES', 'recuérdame cenar'], ['es-MX', 'recuérdame cenar'], ['fr-FR', 'rappelle-moi le dîner'],
  ['de-DE', 'erinnere mich an das Abendessen'], ['it-IT', 'ricordami della cena'], ['pt-BR', 'me lembre do jantar'],
  ['pt-PT', 'lembra-me do jantar'], ['ru-RU', 'напомни мне про ужин'], ['uk-UA', 'нагадай мені про вечерю'],
  ['pl-PL', 'przypomnij mi o kolacji'], ['nl-NL', 'herinner me aan het avondeten'], ['tr-TR', 'bana hatırlat akşam yemeğini'],
  ['ar-SA', 'ذكرني بالعشاء'], ['he-IL', 'תזכיר לי ארוחת ערב'], ['hi-IN', 'मुझे रात के खाने की याद दिलाओ'],
  ['bn-IN', 'রাতের খাবারের কথা মনে করিয়ে দাও'], ['ur-PK', 'مجھے رات کے کھانے کی یاد دلاؤ'],
  ['pa-IN', 'ਮੈਨੂੰ ਰਾਤ ਦੇ ਖਾਣੇ ਦੀ ਯਾਦ ਕਰਾਓ'], ['gu-IN', 'મને રાત્રિભોજનની યાદ કરાવો'],
  ['mr-IN', 'मला रात्रीच्या जेवणाची आठवण करून दे'], ['ta-IN', 'இரவு உணவை நினைவூட்டு'],
  ['te-IN', 'రాత్రి భోజనం గుర్తు చేయు'], ['ja-JP', '夕食を思い出させて'], ['ko-KR', '저녁을 알려줘'],
  ['zh-CN', '提醒我晚饭'], ['zh-TW', '提醒我晚餐'], ['vi-VN', 'nhắc tôi ăn tối'],
  ['th-TH', 'เตือนฉันเรื่องอาหารเย็น'], ['id-ID', 'ingatkan saya makan malam'], ['ms-MY', 'ingatkan saya tentang makan malam'],
  ['fil-PH', 'paalalahanan ako sa hapunan'], ['sv-SE', 'påminn mig om middagen'], ['no-NO', 'minn meg på middag'],
  ['da-DK', 'mind mig om aftensmad'], ['fi-FI', 'muistuta minua illallisesta'], ['cs-CZ', 'připomeň mi večeři'],
  ['sk-SK', 'pripomeň mi večeru'], ['hu-HU', 'emlékeztess a vacsorára'], ['ro-RO', 'amintește-mi de cină'],
  ['bg-BG', 'напомни ми за вечерята'], ['el-GR', 'θύμισέ μου το βραδινό'], ['sr-RS', 'подсети ме на вечеру'],
  ['hr-HR', 'podsjeti me na večeru'], ['sl-SI', 'opomni me na večerjo'], ['sw-KE', 'nikumbushe chakula cha jioni'],
  ['am-ET', 'እራት አስታውሰኝ'], ['fa-AF', 'یادم بنداز شام'], ['fa-TJ', 'ба ман хотиррасон кун'],
];

const RECOMMENDATIONS: Array<[SupportedLocalLanguage, string]> = [
  ['en-US', 'what should i eat for dinner'],
  ['fa-IR', 'برای شام چی بخورم؟'],
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

const FREE_CONVERSATION_NEGATIVES: Array<[SupportedLocalLanguage, string]> = [
  ['en-US', 'tell me a funny story about the ocean'],
  ['fa-IR', 'درباره اقیانوس برام یه داستان تعریف کن'],
  ['es-ES', 'cuéntame una historia divertida'],
  ['fr-FR', 'raconte-moi une histoire drôle'],
  ['de-DE', 'erzähl mir eine lustige Geschichte'],
  ['ja-JP', '海について面白い話をして'],
  ['zh-CN', '给我讲个有趣的故事'],
  ['ar-SA', 'احك لي قصة مضحكة'],
];

describe('Global multilingual understanding certification', () => {
  const lexical = new LocalLanguageUnderstandingService();
  const service = new SemanticMultilingualUnderstandingService(lexical);

  it('keeps the supported locale matrix complete', () => {
    expect(REMINDERS).toHaveLength(51);
  });

  it('recognizes the native reminder contract for every supported locale', () => {
    for (const [locale, input] of REMINDERS) {
      const result = service.understand(input, locale);
      expect(result.language).toBe(locale);
      expect(result.languageConfidence).toBeGreaterThanOrEqual(0.8);
      expect(result.intent).toBe('CREATE_REMINDER');
      expect(result.confidence).toBeGreaterThanOrEqual(0.84);
      expect(result.normalizedText).toBeTruthy();
      expect(result.entities).toBeDefined();
    }
  });

  it('recognizes representative dinner semantics across multiple scripts', () => {
    for (const [locale, input] of RECOMMENDATIONS) {
      const result = service.understand(input, locale);
      expect(result.language).toBe(locale);
      expect(result.intent).toBe('RECOMMEND_MEAL');
      expect(result.confidence).toBeGreaterThanOrEqual(0.72);
    }
  });

  it('does not turn open-ended free conversation into an action command', () => {
    for (const [locale, input] of FREE_CONVERSATION_NEGATIVES) {
      expect(service.understand(input, locale).intent).toBe('UNKNOWN');
    }
  });

  it('is deterministic for every locale in the reminder matrix', () => {
    for (const [locale, input] of REMINDERS) {
      const first = service.understand(input, locale);
      const second = service.understand(input, locale);
      expect(second).toEqual(first);
    }
  });
});
