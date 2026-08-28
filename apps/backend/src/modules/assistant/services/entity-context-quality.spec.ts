import { LocalLanguageUnderstandingService } from './local-language-understanding.service';

describe('Entity and context quality contract', () => {
  const service = new LocalLanguageUnderstandingService();

  it('extracts quantity, meal type and food from natural requests', () => {
    const result = service.understand('امروز ۲ کیلو سیب بخر', 'fa-IR');
    expect(result.entities.quantity).toBe(2);
    expect(result.entities.food).toBe('apple');
  });

  it('extracts time and meal type from reminder speech', () => {
    const result = service.understand('remind me at 18:30 about dinner', 'en-US');
    expect(result.entities.time).toBe('18:30');
    expect(result.entities.mealType).toBe('dinner');
  });

  it('captures negated food constraints', () => {
    const result = service.understand('without chicken, what should I eat?', 'en-US');
    expect(result.entities.excludedFoods).toContain('chicken');
  });

  it('marks conversational references', () => {
    const result = service.understand('همون قبلی رو لغو کن', 'fa-IR');
    expect(result.entities.referencesPrevious).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.84);
  });

  it('keeps language, intent and content confidence deterministic', () => {
    const first = service.understand('show me my calories and protein', 'en-US');
    const second = service.understand('show me my calories and protein', 'en-US');
    expect(first).toEqual(second);
    expect(first.languageConfidence).toBeGreaterThanOrEqual(0.8);
    expect(first.confidence).toBeGreaterThanOrEqual(0.84);
  });
});
