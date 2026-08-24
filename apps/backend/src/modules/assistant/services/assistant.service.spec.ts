import { BrainOrchestratorService } from '../../personal-brain/services/brain-orchestrator.service';
import { AssistantService } from './assistant.service';
import { LocalLanguageUnderstandingService } from './local-language-understanding.service';

describe('AssistantService', () => {
  const makeService = (
    overrides: Partial<{
      processRequest: jest.Mock;
      execute: jest.Mock;
      resolve: jest.Mock;
      append: jest.Mock;
      get: jest.Mock;
      understand: jest.Mock;
      createPlan: jest.Mock;
    }> = {},
  ) => {
    const orchestrator = {
      processRequest: overrides.processRequest ?? jest.fn(),
    } as unknown as BrainOrchestratorService;
    const execution = { execute: overrides.execute ?? jest.fn() } as any;
    const contextual = {
      resolve:
        overrides.resolve ??
        jest.fn().mockResolvedValue({
          referencesPrevious: false,
          operation: 'unknown',
          entities: {},
          clauses: [],
          intents: [],
          contradictions: [],
          confidence: 0.7,
        }),
    } as any;
    const conversation = {
      append: overrides.append ?? jest.fn().mockResolvedValue(undefined),
      get: overrides.get ?? jest.fn().mockResolvedValue({ turns: [] }),
    } as any;
    const localLanguageUnderstanding = {
      understand:
        overrides.understand ??
        jest
          .fn()
          .mockReturnValue({ intent: 'UNKNOWN', confidence: 0, entities: {} }),
    } as any;
    const planning = {
      createPlan:
        overrides.createPlan ??
        jest.fn().mockResolvedValue({
          requiresClarification: false,
          reason: 'ok',
          clauses: [],
          intents: [],
          contradictions: [],
          confidence: 0.7,
        }),
    } as any;
    return new AssistantService(
      orchestrator,
      execution,
      contextual,
      conversation,
      localLanguageUnderstanding,
      planning,
    );
  };

  it('returns the assistant status', async () => {
    const service = makeService();
    await expect(service.getStatus()).resolves.toEqual({
      name: 'My Personal Assistant',
      status: 'brain foundation active',
    });
  });

  it('delegates assistant requests to the brain orchestrator with the user id', async () => {
    const processRequest = jest.fn().mockResolvedValue({
      message: 'ok',
      intent: 'general',
      confidence: 1,
      nextAction: undefined,
    });
    const service = makeService({ processRequest });

    await expect(service.process('hello', 'user-123')).resolves.toMatchObject({
      message: 'ok',
      intent: 'general',
      confidence: 1,
    });
    expect(processRequest).toHaveBeenCalledWith('hello', 'user-123');
  });

  it('maps a linked workout update to update_workout', () => {
    const service = makeService() as any;
    const result = service.resolveContextualExecution(
      {
        intent: 'conversation',
        nextAction: undefined,
        confidence: 0.9,
        message: 'ok',
      },
      {
        referencesPrevious: true,
        operation: 'update',
        targetAction: 'create_workout',
        targetResourceType: 'workout',
        targetResourceId: 'w1',
        entities: {},
      },
      'همون تمرین رو 60 دقیقه کن',
    );
    expect(result).toMatchObject({
      intent: 'workout',
      nextAction: 'update_workout',
    });
  });

  it('maps a linked habit cancellation to delete_habit', () => {
    const service = makeService() as any;
    const result = service.resolveContextualExecution(
      {
        intent: 'conversation',
        nextAction: undefined,
        confidence: 0.9,
        message: 'ok',
      },
      {
        referencesPrevious: true,
        operation: 'cancel',
        targetAction: 'create_habit',
        targetResourceType: 'habit',
        targetResourceId: 'h1',
        entities: {},
      },
      'همون عادت رو لغو کن',
    );
    expect(result).toMatchObject({
      intent: 'habit',
      nextAction: 'delete_habit',
    });
  });

  it('maps a linked supplement update to update_supplement', () => {
    const service = makeService() as any;
    const result = service.resolveContextualExecution(
      {
        intent: 'conversation',
        nextAction: undefined,
        confidence: 0.9,
        message: 'ok',
      },
      {
        referencesPrevious: true,
        operation: 'update',
        targetAction: 'take_supplement',
        targetResourceType: 'supplement',
        targetResourceId: 's1',
        entities: {},
      },
      'همون مکمل رو ساعت 21:00 بذار',
    );
    expect(result).toMatchObject({
      intent: 'supplement',
      nextAction: 'update_supplement',
    });
  });

  it('does not rewrite an unrelated command', () => {
    const service = makeService() as any;
    const response = {
      intent: 'conversation',
      nextAction: 'create_reminder',
      confidence: 0.9,
      message: 'ok',
    };
    const result = service.resolveContextualExecution(
      response,
      { referencesPrevious: false, operation: 'unknown', entities: {} },
      'یک یادآوری جدید بساز',
    );
    expect(result).toBe(response);
  });

  it('recognizes representative native-language reminder requests across the supported locale matrix', () => {
    const service = new LocalLanguageUnderstandingService();
    const cases: Array<[string, string]> = [
      ['fa-IR', 'یادم بنداز شام'], ['en-US', 'remind me about dinner'], ['es-ES', 'recuérdame cenar'],
      ['fr-FR', 'rappelle-moi le dîner'], ['de-DE', 'erinnere mich an das Abendessen'], ['it-IT', 'ricordami della cena'],
      ['pt-BR', 'me lembre do jantar'], ['ru-RU', 'напомни мне про ужин'], ['tr-TR', 'akşam yemeğini hatırlat'],
      ['ar-SA', 'ذكرني بالعشاء'], ['he-IL', 'תזכיר לי ארוחת ערב'], ['hi-IN', 'मुझे रात के खाने की याद दिलाओ'],
      ['bn-IN', 'রাতের খাবারের কথা মনে করিয়ে দাও'], ['ur-PK', 'مجھے رات کے کھانے کی یاد دلاؤ'], ['pa-IN', 'ਮੈਨੂੰ ਰਾਤ ਦੇ ਖਾਣੇ ਦੀ ਯਾਦ ਕਰਾਓ'],
      ['ta-IN', 'இரவு உணவை நினைவூட்டு'], ['te-IN', 'రాత్రి భోజనం గుర్తు చేయు'], ['ja-JP', '夕食を思い出させて'],
      ['ko-KR', '저녁을 알려줘'], ['zh-CN', '提醒我晚饭'], ['zh-TW', '提醒我晚餐'], ['vi-VN', 'nhắc tôi ăn tối'],
      ['th-TH', 'เตือนฉันเรื่องอาหารเย็น'], ['id-ID', 'ingatkan saya makan malam'], ['ms-MY', 'ingatkan saya tentang makan malam'],
      ['fil-PH', 'paalalahanan ako sa hapunan'], ['sv-SE', 'påminn mig om middagen'], ['no-NO', 'minn meg på middag'],
      ['da-DK', 'mind mig om aftensmad'], ['fi-FI', 'muistuta minua illallisesta'], ['cs-CZ', 'připomeň mi večeři'],
      ['sk-SK', 'pripomeň mi večeru'], ['hu-HU', 'emlékeztess a vacsorára'], ['ro-RO', 'amintește-mi de cină'],
      ['bg-BG', 'напомни ми за вечерята'], ['el-GR', 'θύμισέ μου το βραδινό'], ['sr-RS', 'подсети ме на вечеру'],
      ['hr-HR', 'podsjeti me na večeru'], ['sl-SI', 'opomni me na večerjo'], ['sw-KE', 'nikumbushe chakula cha jioni'],
      ['am-ET', 'እራት አስታውሰኝ'], ['fa-AF', 'یادم بنداز شام'], ['fa-TJ', 'ба ман хотиррасон кун'], ['en-GB', 'remind me about dinner'],
      ['es-MX', 'recuérdame cenar'], ['uk-UA', 'нагадай мені про вечерю'], ['pl-PL', 'przypomnij mi o kolacji'],
      ['nl-NL', 'herinner me aan het avondeten'], ['gu-IN', 'મને રાત્રિભોજનની યાદ કરાવો'], ['mr-IN', 'मला रात्रीच्या जेवणाची आठवण करून दे'],
    ];

    for (const [locale, input] of cases) {
      const result = service.understand(input, locale);
      expect(result.language).toBe(locale);
      expect(result.intent).toBe('CREATE_REMINDER');
      expect(result.confidence).toBeGreaterThanOrEqual(0.84);
    }
  });

  it('keeps a preferred locale authoritative for code-switched speech', () => {
    const service = new LocalLanguageUnderstandingService();
    const result = service.understand('remind me درباره شام', 'fa-IR');
    expect(result.language).toBe('fa-IR');
    expect(result.intent).toBe('CREATE_REMINDER');
  });
});
