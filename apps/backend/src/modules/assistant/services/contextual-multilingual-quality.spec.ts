import { ContextualCommandService } from './contextual-command.service';

type Case = {
  locale: string;
  reference: string;
};

const REFERENCE_MATRIX: Case[] = [
  ['fa-IR', 'همون قبلی رو ساعت ۸ بذار'], ['en-US', 'change that one to 8 pm'], ['en-GB', 'update the previous one'],
  ['es-ES', 'cambia ese por las ocho'], ['es-MX', 'actualiza el anterior'], ['fr-FR', 'modifie celui-là'],
  ['de-DE', 'ändere das vorherige'], ['it-IT', 'modifica quello precedente'], ['pt-BR', 'altera o anterior'],
  ['pt-PT', 'muda o anterior'], ['ru-RU', 'измени предыдущее'], ['uk-UA', 'зміни попереднє'],
  ['pl-PL', 'zmień poprzedni'], ['nl-NL', 'wijzig de vorige'], ['tr-TR', 'öncekini değiştir'],
  ['ar-SA', 'عدّل السابق'], ['he-IL', 'שנה את הקודם'], ['hi-IN', 'पिछले वाले को बदलो'],
  ['bn-IN', 'আগেরটাকে বদলাও'], ['ur-PK', 'پچھلے والے کو بدل دو'], ['pa-IN', 'ਪਿਛਲੇ ਵਾਲੇ ਨੂੰ ਬਦਲੋ'],
  ['gu-IN', 'પહેલાનું બદલો'], ['mr-IN', 'मागचे बदला'], ['ta-IN', 'முந்தையதை மாற்று'],
  ['te-IN', 'మునుపటిదాన్ని మార్చు'], ['ja-JP', '前のものを変更して'], ['ko-KR', '이전 것을 바꿔줘'],
  ['zh-CN', '把上一个改一下'], ['zh-TW', '把上一個改一下'], ['vi-VN', 'đổi cái trước đó'],
  ['th-TH', 'เปลี่ยนอันก่อนหน้านี้'], ['id-ID', 'ubah yang sebelumnya'], ['ms-MY', 'ubah yang sebelumnya'],
  ['fil-PH', 'baguhin yung nauna'], ['sv-SE', 'ändra den förra'], ['no-NO', 'endre den forrige'],
  ['da-DK', 'ændr den forrige'], ['fi-FI', 'muuta edellistä'], ['cs-CZ', 'změň předchozí'],
  ['sk-SK', 'zmeň predchádzajúce'], ['hu-HU', 'változtasd meg az előzőt'], ['ro-RO', 'schimbă precedentul'],
  ['bg-BG', 'промени предишното'], ['el-GR', 'άλλαξε το προηγούμενο'], ['sr-RS', 'promeni prethodno'],
  ['hr-HR', 'promijeni prethodno'], ['sl-SI', 'spremeni prejšnje'], ['sw-KE', 'badilisha ya awali'],
  ['am-ET', 'ቀድሞውን ቀይር'], ['fa-AF', 'قبلی را تغییر بده'], ['fa-TJ', 'қаблиро тағйир деҳ'],
].map(([locale, reference]) => ({ locale, reference }));

const makeService = () => {
  const context = {
    get: jest.fn().mockResolvedValue({
      turns: [],
      lastAction: {
        action: 'create_reminder',
        executionId: 'rem-123',
        resourceType: 'reminder',
        resourceId: 'resource-123',
      },
    }),
  } as any;
  return new ContextualCommandService(context);
};

describe('ContextualCommandService multilingual context quality', () => {
  it('resolves a previous reference in every registered locale family', async () => {
    const service = makeService();
    expect(REFERENCE_MATRIX).toHaveLength(51);

    for (const { locale, reference } of REFERENCE_MATRIX) {
      const result = await service.resolve('u1', reference);
      expect(result.referencesPrevious).toBe(true);
      expect(result.operation).toBe('update');
      expect(result.targetAction).toBe('create_reminder');
      expect(result.targetExecutionId).toBe('rem-123');
      expect(result.targetResourceId).toBe('resource-123');
    }
  });

  it('resolves natural reference + entity follow-ups', async () => {
    const service = makeService();
    const cases = [
      ['fa-IR', 'همون قبلی رو ساعت ۸:۳۰ بذار', '08:30'],
      ['en-US', 'change that one to 08:30', '08:30'],
      ['ja-JP', '前のものを8:30にして', '08:30'],
      ['zh-CN', '把上一个改到08:30', '08:30'],
    ] as const;

    for (const [, text, expectedTime] of cases) {
      const result = await service.resolve('u1', text);
      expect(result.referencesPrevious).toBe(true);
      expect(result.operation).toBe('update');
      expect(result.entities.time).toBe(expectedTime);
    }
  });

  it('does not bind a standalone command to previous context', async () => {
    const service = makeService();
    const result = await service.resolve('u1', 'set a new reminder for tomorrow at 8');
    expect(result.referencesPrevious).toBe(false);
    expect(result.operation).toBe('create');
    expect(result.targetAction).toBeUndefined();
    expect(result.targetResourceId).toBeUndefined();
  });

  it('keeps references deterministic across repeated calls', async () => {
    const service = makeService();
    const text = '前のものを変更して';
    const first = await service.resolve('u1', text);
    const second = await service.resolve('u1', text);
    expect(second).toEqual(first);
  });
});
