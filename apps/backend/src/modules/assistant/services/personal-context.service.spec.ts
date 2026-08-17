import { PersonalContextService } from './personal-context.service';

describe('PersonalContextService', () => {
  it('assembles user, conversation, nutrition and life context in parallel', async () => {
    const user = { id: 'u1', name: 'Ramin', timezone: 'Asia/Tehran', language: 'fa' };
    const conversation = {
      turns: [],
      lastUserMessage: undefined,
      lastAssistantMessage: undefined,
      lastAction: undefined,
    };
    const nutrition = { dateKey: '2026-08-17', meals: { calories: 1800, protein: 120 } };
    const life = { goals: { active: 1 }, fitness: { disciplines: ['gym'] } };

    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
    } as any;
    const conversationService = {
      get: jest.fn().mockResolvedValue(conversation),
    } as any;
    const nutritionService = {
      getDailySummary: jest.fn().mockResolvedValue(nutrition),
    } as any;
    const lifeService = {
      getToday: jest.fn().mockResolvedValue(life),
    } as any;

    const service = new PersonalContextService(
      prisma,
      conversationService,
      nutritionService,
      lifeService,
    );

    await expect(
      service.build({
        userId: 'u1',
        input: 'امروز چقدر پروتئین گرفتم؟',
        dateKey: '2026-08-17',
      }),
    ).resolves.toEqual({
      user,
      dateKey: '2026-08-17',
      request: { input: 'امروز چقدر پروتئین گرفتم؟' },
      conversation,
      nutrition,
      life,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: { id: true, name: true, timezone: true, language: true },
    });
    expect(conversationService.get).toHaveBeenCalledWith('u1');
    expect(nutritionService.getDailySummary).toHaveBeenCalledWith(
      'u1',
      '2026-08-17',
    );
    expect(lifeService.getToday).toHaveBeenCalledWith('u1', '2026-08-17');
  });

  it('uses the current UTC date key when none is supplied', async () => {
    const service = new PersonalContextService(
      { user: { findUnique: jest.fn().mockResolvedValue(null) } } as any,
      { get: jest.fn().mockResolvedValue({ turns: [] }) } as any,
      { getDailySummary: jest.fn().mockResolvedValue({}) } as any,
      { getToday: jest.fn().mockResolvedValue({}) } as any,
    );

    const result = await service.build({ userId: 'u1' });
    const expected = new Date().toISOString().slice(0, 10);

    expect(result.dateKey).toBe(expected);
  });
});
