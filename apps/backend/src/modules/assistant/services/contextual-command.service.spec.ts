import { ContextualCommandService } from './contextual-command.service';

describe('ContextualCommandService', () => {
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

  it('resolves a follow-up update against the previous action', async () => {
    const result = await makeService().resolve('u1', 'نه، همون رو ساعت ۸:۳۰ بذار');
    expect(result.referencesPrevious).toBe(true);
    expect(result.operation).toBe('update');
    expect(result.targetAction).toBe('create_reminder');
    expect(result.targetExecutionId).toBe('rem-123');
    expect(result.entities.time).toBe('08:30');
  });

  it('resolves Persian pronouns and extracts quantity', async () => {
    const result = await makeService().resolve('u1', 'اونو دو تا کن');
    expect(result.referencesPrevious).toBe(true);
    expect(result.operation).toBe('update');
    expect(result.entities.quantity).toBe(2);
    expect(result.targetResourceId).toBe('resource-123');
  });

  it('extracts duration from a natural follow-up', async () => {
    const result = await makeService().resolve('u1', 'همون قبلی رو ۳۰ دقیقه کن');
    expect(result.referencesPrevious).toBe(true);
    expect(result.entities.durationMinutes).toBe(30);
  });

  it('does not attach a previous target to a standalone create command', async () => {
    const result = await makeService().resolve('u1', 'برای فردا ساعت ۸ یادم بنداز ورزش کنم');
    expect(result.referencesPrevious).toBe(false);
    expect(result.operation).toBe('create');
    expect(result.targetAction).toBeUndefined();
  });

  it('splits multilingual long requests into executable clauses', async () => {
    const service = makeService();
    const cases = [
      ['u1', 'remind me tomorrow and add chicken to my basket'],
      ['u1', 'rappelle-moi demain puis ajoute le poulet au panier'],
      ['u1', 'erinnere mich morgen und füge hühnchen zum warenkorb hinzu'],
      ['u1', '明天提醒我，然后把鸡肉放进购物车'],
      ['u1', 'یادم بنداز فردا و بعد مرغ رو به سبد اضافه کن'],
    ] as const;

    for (const [userId, input] of cases) {
      const result = await service.resolve(userId, input);
      expect(result.clauses.length).toBe(2);
      expect(result.clauses[0]).toBeTruthy();
      expect(result.clauses[1]).toBeTruthy();
    }
  });

  it('extracts common multilingual relative dates', async () => {
    const service = makeService();
    const tomorrowInputs = [
      'remind me tomorrow',
      'rappelle-moi demain',
      'recuérdame mañana',
      'erinnere mich morgen',
      'ricordamelo domani',
      'napomni zavtra',
      'yarın hatırlat',
      '明天提醒我',
      'ذكرني غدًا',
    ];

    for (const input of tomorrowInputs) {
      const result = await service.resolve('u1', input);
      expect(result.entities.date).toBe('tomorrow');
    }
  });

  it('keeps negated creation requests ambiguous rather than executable', async () => {
    const result = await makeService().resolve('u1', 'please do not add chicken to the basket');
    expect(result.entities.negated).toBe(true);
    expect(result.contradictions).toContain('negation_create_ambiguity');
  });
});
