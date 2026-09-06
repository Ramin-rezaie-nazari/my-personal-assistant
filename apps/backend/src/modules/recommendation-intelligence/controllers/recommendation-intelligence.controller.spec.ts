import { BadRequestException } from '@nestjs/common';
import { RecommendationIntelligenceController } from './recommendation-intelligence.controller';

describe('RecommendationIntelligenceController', () => {
  const engine = { generateRecommendations: jest.fn() };
  const controller = new RecommendationIntelligenceController(engine as never);

  beforeEach(() => jest.clearAllMocks());

  it('delegates an authenticated food recommendation request', async () => {
    engine.generateRecommendations.mockResolvedValue({ recommendations: [] });

    await expect(
      controller.generateFoodRecommendations(
        { user: { id: 'u1' } },
        { targetServings: 2, countryCode: 'IR' },
      ),
    ).resolves.toEqual({ recommendations: [] });

    expect(engine.generateRecommendations).toHaveBeenCalledWith('u1', {
      targetServings: 2,
      countryCode: 'IR',
    });
  });

  it('rejects invalid serving counts before touching the engine', () => {
    expect(() =>
      controller.generateFoodRecommendations(
        { user: { id: 'u1' } },
        { targetServings: 0 },
      ),
    ).toThrow(BadRequestException);
    expect(engine.generateRecommendations).not.toHaveBeenCalled();
  });

  it('rejects non-integer strict missing-ingredient thresholds', () => {
    expect(() =>
      controller.generateFoodRecommendations(
        { user: { id: 'u1' } },
        { targetServings: 2, maxMissingIngredients: 1.5 },
      ),
    ).toThrow(BadRequestException);
    expect(engine.generateRecommendations).not.toHaveBeenCalled();
  });
});
