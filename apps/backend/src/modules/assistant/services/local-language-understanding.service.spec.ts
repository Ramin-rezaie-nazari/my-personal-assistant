import { LocalLanguageUnderstandingService } from './local-language-understanding.service';

describe('LocalLanguageUnderstandingService', () => {
  const service = new LocalLanguageUnderstandingService();

  it('understands natural basket requests with quantity', () => {
    const result = service.understand('دو تا شیر به سبد خرید اضافه کن');
    expect(result.intent).toBe('ADD_TO_BASKET');
    expect(result.entities.food).toBe('milk');
    expect(result.entities.quantity).toBe(2);
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('understands Persian quantity words', () => {
    const result = service.understand('یه نان به سبد خرید اضافه کن');
    expect(result.intent).toBe('ADD_TO_BASKET');
    expect(result.entities.food).toBe('bread');
    expect(result.entities.quantity).toBe(1);
  });

  it('does not leak household or budget numbers into generic quantity', () => {
    const result = service.understand(
      'برای ۴ نفر بودجه حداکثر ۱۵ میلیون تومان برای شام میخوام',
    );
    expect(result.entities.householdSize).toBe(4);
    expect(result.entities.budgetAmount).toBe(15_000_000);
    expect(result.entities.quantity).toBeUndefined();
  });

  it('understands reminder requests and extracts time', () => {
    const result = service.understand('یادم بنداز ساعت 18:30 آب بخورم');
    expect(result.intent).toBe('CREATE_REMINDER');
    expect(result.entities.time).toBe('18:30');
    expect(result.confidence).toBeGreaterThan(0.85);
  });

  it('normalizes Persian digits for quantities and times', () => {
    const result = service.understand('۲ تا شیر اضافه کن ساعت ۱۸:۳۰');
    expect(result.intent).toBe('ADD_TO_BASKET');
    expect(result.entities.quantity).toBe(2);
    expect(result.entities.time).toBe('18:30');
  });

  it('extracts meal-planning constraints without requiring cloud AI', () => {
    const result = service.understand(
      'برای ۴ نفر بودجه غذا حداکثر ۱۵ میلیون تومان و پروتئین ۱۲۰ گرم برای شام میخوام، بدون شیر وگان نباشه',
    );
    expect(result.intent).toBe('RECOMMEND_MEAL');
    expect(result.entities.householdSize).toBe(4);
    expect(result.entities.budgetAmount).toBe(15_000_000);
    expect(result.entities.budgetCurrency).toBe('IRT');
    expect(result.entities.proteinGrams).toBe(120);
    expect(result.entities.mealType).toBe('dinner');
    expect(result.entities.excludedFoods).toContain('milk');
    expect(result.entities.dietaryPreferences).toContain('vegan');
  });

  it('recognizes non-IRT budget currencies instead of relabeling them', () => {
    const result = service.understand('حداکثر بودجه 500 USD برای غذا');
    expect(result.entities.budgetAmount).toBe(500);
    expect(result.entities.budgetCurrency).toBe('USD');
  });

  it('extracts allergy constraints as hard safety-relevant context', () => {
    const result = service.understand('برای من حساسیت به شیر و لبنیات مهمه');
    expect(result.entities.allergies).toEqual(['dairy', 'milk']);
  });

  it('understands meal and nutrition requests', () => {
    expect(service.understand('برای شام چی بخورم؟').intent).toBe(
      'RECOMMEND_MEAL',
    );
    expect(service.understand('پروتئین و کالری امروزمو بگو').intent).toBe(
      'GET_NUTRITION_SUMMARY',
    );
  });

  it('keeps ambiguous requests unknown instead of guessing', () => {
    const result = service.understand('یه کاری برام انجام بده');
    expect(result.intent).toBe('UNKNOWN');
    expect(result.confidence).toBe(0);
  });
});
