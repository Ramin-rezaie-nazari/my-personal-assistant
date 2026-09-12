import { addBudgetQualifiedRecipeShopping, getRecipeFoodBudget } from './api';

jest.mock('./api', () => {
  const actual = jest.requireActual<typeof import('./api')>('./api');
  return actual;
});

describe('recipe budget API contract', () => {
  it('exports recipe budget helpers from the canonical API transport', () => {
    expect(typeof getRecipeFoodBudget).toBe('function');
    expect(typeof addBudgetQualifiedRecipeShopping).toBe('function');
  });
});
