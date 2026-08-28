import { PersonalizationService } from './personalization.service';

describe('PersonalizationService', () => {
  it('builds food context from profile, nutrition, recent meals and facts', async () => {
    const prisma = {
      userProfile: {
        findUnique: jest.fn().mockResolvedValue({ primaryGoal: 'weight loss' }),
      },
      assistantProfile: {
        findUnique: jest.fn().mockResolvedValue({ nutritionGoal: 'high protein' }),
      },
      nutritionProfile: {
        findUnique: jest.fn().mockResolvedValue({
          dietType: 'vegetarian',
          dailyCaloriesGoal: 2000,
          proteinGoalGrams: 120,
        }),
      },
      meal: {
        findMany: jest.fn().mockResolvedValue([
          { name: 'Lentil Soup' },
          { name: 'Greek Salad' },
        ]),
      },
      userFact: {
        findMany: jest.fn().mockResolvedValue([
          { category: 'allergy', value: 'peanut, shrimp' },
          { category: 'dietary', value: 'low sugar' },
        ]),
      },
    };

    const service = new PersonalizationService(prisma as never);
    const context = await service.buildFoodContext('user-1');

    expect(context).toEqual({
      primaryGoal: 'weight loss',
      nutritionGoal: 'high protein',
      dietType: 'vegetarian',
      dailyCaloriesGoal: 2000,
      proteinGoalGrams: 120,
      recentMealNames: ['Lentil Soup', 'Greek Salad'],
      allergyTerms: ['peanut', 'shrimp'],
      dietaryTerms: ['low sugar'],
    });
  });
});
