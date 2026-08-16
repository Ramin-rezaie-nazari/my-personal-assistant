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

  it('prefers specific food phrases', () => {
    const result = service.understand('ماست کم چرب بخر');
    expect(result.intent).toBe('ADD_TO_BASKET');
    expect(result.entities.food).toBe('yogurt');
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
