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

  it('keeps ambiguous requests unknown instead of guessing', () => {
    const result = service.understand('یه کاری برام انجام بده');
    expect(result.intent).toBe('UNKNOWN');
    expect(result.confidence).toBe(0);
  });
});
