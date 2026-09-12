import { addBudgetQualifiedRecipeShopping, getRecipeFoodBudget } from './api';

describe('recipe budget API contract', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as never;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [] }) });
  });

  it('builds a normalized budget-plan request through canonical transport', async () => {
    await getRecipeFoodBudget('recipe 1', 4, 1500000, 'irt', 'ir');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/recipes/recipe%201/food-plan/budget?servings=4&budget=1500000&currency=IRT&countryCode=IR',
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it('posts budget-qualified shopping through canonical transport', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ shopping: { added: 1 } }) });
    await addBudgetQualifiedRecipeShopping('recipe-1', 2, 10, 'USD');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/recipes/recipe-1/food-plan/budget-shopping?servings=2&budget=10&currency=USD',
      expect.objectContaining({ method: 'POST', headers: expect.any(Headers) }),
    );
  });
});
