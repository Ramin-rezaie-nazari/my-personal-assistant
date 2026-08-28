import { LocalLanguageUnderstandingService } from './local-language-understanding.service';
import { MultilingualConstraintExtractionService } from './multilingual-constraint-extraction.service';

describe('MultilingualConstraintExtractionService', () => {
  const service = new MultilingualConstraintExtractionService();
  const locales = new LocalLanguageUnderstandingService();

  it.each([
    ['en-US', 'if dinner is under 20, add 2 cups of rice'],
    ['fa-IR', 'اگر شام زیر ۲۰ باشد، ۲ پیمانه برنج اضافه کن'],
    ['es-ES', 'si la cena cuesta menos de 20, añade 2 tazas'],
    ['fr-FR', 'si le dîner coûte moins de 20, ajoute 2 tasses'],
    ['de-DE', 'wenn das Abendessen unter 20 liegt, füge 2 Tassen hinzu'],
    ['ru-RU', 'если ужин меньше 20, добавь 2'],
    ['tr-TR', 'eğer akşam yemeği 20 altında ise 2 kilo ekle'],
    ['ja-JP', '夕食が20未満なら2カップ追加して'],
  ])('extracts conditional + numeric constraints for %s', (locale, input) => {
    const result = service.extract(input, locale as Parameters<typeof service.extract>[1]);
    expect(result.conditional).toBe(true);
    expect(result.constraints.some((item) => item.kind === 'condition')).toBe(true);
    expect(result.constraints.some((item) => item.kind === 'quantity' && item.value === 2)).toBe(true);
  });

  it.each([
    ['en-US', "don't add 500 g chicken"],
    ['fa-IR', '۵۰۰ گرم مرغ اضافه نکن'],
    ['es-ES', 'no añadas 500 g de pollo'],
    ['fr-FR', 'n’ajoute pas 500 g de poulet'],
    ['de-DE', 'füge nicht 500 g Hähnchen hinzu'],
    ['ja-JP', '鶏肉を500g追加しない'],
  ])('preserves negation for %s', (locale, input) => {
    const result = service.extract(input, locale as Parameters<typeof service.extract>[1]);
    expect(result.constraints.some((item) => item.kind === 'negation' && item.value === true)).toBe(true);
    expect(result.constraints.some((item) => item.kind === 'quantity')).toBe(true);
  });

  it('extracts multiple quantities, attached units, fraction and Persian digits', () => {
    const result = service.extract('add 500g chicken and 1/2 cup rice plus ۲ لیتر آب', 'en-US');
    expect(result.constraints.filter((item) => item.kind === 'quantity')).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: 500 }),
      expect.objectContaining({ value: 0.5 }),
      expect.objectContaining({ value: 2 }),
    ]));
    expect(result.constraints.filter((item) => item.kind === 'unit')).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: 'gram' }),
      expect.objectContaining({ value: 'cup' }),
      expect.objectContaining({ value: 'liter' }),
    ]));
  });

  it('extracts metric/imperial units, time, duration and budget together', () => {
    const result = service.extract('add 2.5 lb chicken at 19:30 for 20 minutes under $30', 'en-US');
    expect(result.constraints).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'quantity', value: 2.5 }),
      expect.objectContaining({ kind: 'unit', value: 'pound' }),
      expect.objectContaining({ kind: 'time', value: '19:30' }),
      expect.objectContaining({ kind: 'duration', value: 20 }),
      expect.objectContaining({ kind: 'budget', value: 30 }),
    ]));
  });

  it.each([
    ['en-US', 'schedule it tomorrow at 08:15'],
    ['fa-IR', 'فردا ساعت ۰۸:۱۵ یادم بنداز'],
    ['es-ES', 'recuérdamelo mañana a las 08:15'],
    ['ja-JP', '明日08:15にリマインドして'],
  ])('extracts relative date and clock time for %s', (locale, input) => {
    const result = service.extract(input, locale as Parameters<typeof service.extract>[1]);
    expect(result.constraints).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'date' }),
      expect.objectContaining({ kind: 'time', value: '08:15' }),
    ]));
  });

  it.each([
    ['en-US', 'make it vegan and high protein'],
    ['fa-IR', 'غذای وگان و پروتئین بالا'],
    ['de-DE', 'vegetarisch und glutenfrei'],
    ['ja-JP', 'ビーガンで高タンパク'],
  ])('extracts diet constraints for %s', (locale, input) => {
    const result = service.extract(input, locale as Parameters<typeof service.extract>[1]);
    expect(result.constraints.some((item) => item.kind === 'diet')).toBe(true);
  });

  it('flags contradictory affirmative/removal combinations instead of treating them as ordinary constraints', () => {
    const result = service.extract('add chicken but cancel and remove it', 'en-US');
    expect(result.contradictory).toBe(true);
  });

  it('does not mark a simple negated add as contradictory', () => {
    const result = service.extract("don't add chicken", 'en-US');
    expect(result.contradictory).toBe(false);
    expect(result.constraints.some((item) => item.kind === 'negation')).toBe(true);
  });

  it('does not invent locale-specific state when no constraint signal exists', () => {
    const result = service.extract('what should I eat tonight', 'en-US');
    expect(result.constraints).toEqual([]);
    expect(result.conditional).toBe(false);
    expect(result.contradictory).toBe(false);
    expect(locales.understand('what should I eat tonight', 'en-US').intent).toBe('RECOMMEND_MEAL');
  });
});
