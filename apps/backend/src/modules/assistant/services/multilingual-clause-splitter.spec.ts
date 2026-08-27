import { splitMultilingualClauses } from './multilingual-clause-splitter';

describe('splitMultilingualClauses', () => {
  it.each([
    ['remind me tomorrow and add chicken to my basket', ['remind me tomorrow', 'add chicken to my basket']],
    ['rappelle-moi demain et puis ajoute le poulet au panier', ['rappelle-moi demain', 'ajoute le poulet au panier']],
    ['erinnere mich morgen und füge hühnchen zum warenkorb hinzu', ['erinnere mich morgen', 'füge hühnchen zum warenkorb hinzu']],
    ['明天提醒我，然后把鸡肉放进购物车', ['明天提醒我', '把鸡肉放进购物车']],
    ['یادم بنداز فردا و بعد مرغ رو به سبد اضافه کن', ['یادم بنداز فردا', 'مرغ رو به سبد اضافه کن']],
    ['remind me tomorrow; add chicken to my basket. then tell me calories', ['remind me tomorrow', 'add chicken to my basket', 'then tell me calories']],
  ])('splits multilingual multi-intent input: %s', (input, expected) => {
    expect(splitMultilingualClauses(input)).toEqual(expected);
  });

  it('is deterministic and ignores empty input', () => {
    expect(splitMultilingualClauses('')).toEqual([]);
    expect(splitMultilingualClauses('   ')).toEqual([]);

    const input = '明天提醒我，然后把鸡肉放进购物车';
    expect(splitMultilingualClauses(input)).toEqual(splitMultilingualClauses(input));
  });
});
