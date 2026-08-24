import {
  LocalLanguageUnderstandingService,
  type SupportedLocalLanguage,
} from './local-language-understanding.service';
import { SemanticMultilingualUnderstandingService } from './semantic-multilingual-understanding.service';

const REMINDER_MATRIX: Array<[SupportedLocalLanguage, string]> = [
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
  ['th-TH', 'เตือนฉันเรื่องอาหารเย็น'], ['id-ID', 'ingatkan saya makan malam'],
  ['ms-MY', 'ingatkan saya tentang makan malam'], ['fil-PH', 'paalalahanan ako sa hapunan'],
  ['sv-SE', 'påminn mig om middagen'], ['no-NO', 'minn meg på middag'], ['da-DK', 'mind mig om aftensmad'],
  ['fi-FI', 'muistuta minua illallisesta'], ['cs-CZ', 'připomeň mi večeři'], ['sk-SK', 'pripomeň mi večeru'],
  ['hu-HU', 'emlékeztess a vacsorára'], ['ro-RO', 'amintește-mi de cină'], ['bg-BG', 'напомни ми за вечерята'],
  ['el-GR', 'θύμισέ μου το βραδινό'], ['sr-RS', 'подсети ме на вечеру'], ['hr-HR', 'podsjeti me na večeru'],
  ['sl-SI', 'opomni me na večerjo'], ['sw-KE', 'nikumbushe chakula cha jioni'], ['am-ET', 'እራት አስታውሰኝ'],
  ['fa-AF', 'یادم بنداز شام'], ['fa-TJ', 'ба ман хотиррасон кун'],
];

const duplicateFirstCharacter = (input: string): string => {
  const chars = [...input];
  const index = chars.findIndex((char) => /\S/u.test(char));
  if (index < 0) return input;
  chars.splice(index, 0, chars[index]);
  return chars.join('');
};

describe('Semantic multilingual adversarial quality', () => {
  const service = new SemanticMultilingualUnderstandingService(
    new LocalLanguageUnderstandingService(),
  );

  it('refuses a weak partial semantic overlap instead of inventing an action', () => {
    expect(service.understand('help me later', 'en-US').intent).toBe('UNKNOWN');
    expect(service.understand('maybe dinner later', 'en-US').intent).toBe('UNKNOWN');
  });

  it('recovers one-character ASR duplication across all 51 supported locales', () => {
    expect(REMINDER_MATRIX).toHaveLength(51);

    for (const [locale, input] of REMINDER_MATRIX) {
      const corrupted = duplicateFirstCharacter(input);
      const result = service.understand(corrupted, locale);
      expect(result.language).toBe(locale);
      expect(result.intent).toBe('CREATE_REMINDER');
      expect(result.confidence).toBeGreaterThanOrEqual(0.72);
    }
  });

  it('recovers adjacent-character transposition for supported semantic locales', () => {
    expect(service.understand('what cna i eat', 'en-US').intent).toBe('RECOMMEND_MEAL');
    expect(service.understand('que mnager ce soir', 'fr-FR').intent).toBe('RECOMMEND_MEAL');
    expect(service.understand('hilf mir beim abendessen', 'de-DE').intent).toBe('RECOMMEND_MEAL');
  });

  it('keeps multi-intent clauses separable without changing clause order', () => {
    expect(service.splitClauses('remind me tomorrow and add chicken to my basket')).toEqual([
      'remind me tomorrow',
      'add chicken to my basket',
    ]);
    expect(service.splitClauses('یادم بنداز فردا و بعد مرغ رو به سبد اضافه کن')).toEqual([
      'یادم بنداز فردا',
      'مرغ رو به سبد اضافه کن',
    ]);
    expect(service.splitClauses('提醒我明天吃饭 然后 把鸡肉放进购物车')).toEqual([
      '提醒我明天吃饭',
      '把鸡肉放进购物车',
    ]);
    expect(service.splitClauses('それから夕食を決めて そして 買い物に追加して')).toEqual([
      'それから夕食を決めて',
      '買い物に追加して',
    ]);
  });

  it('stays deterministic across repeated ambiguous and repaired inputs', () => {
    const input = duplicateFirstCharacter('recuérdame cenar');
    const first = service.understand(input, 'es-ES');
    const second = service.understand(input, 'es-ES');
    expect(second).toEqual(first);
  });
});
