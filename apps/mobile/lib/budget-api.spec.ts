import fs from 'node:fs';
import path from 'node:path';

describe('recipe budget API contract', () => {
  const apiSource = fs.readFileSync(path.join(__dirname, 'api.ts'), 'utf8');

  it('keeps recipe budget helpers on the canonical request transport', () => {
    expect(apiSource).toContain('export async function request<T>');
    expect(apiSource).toContain('export function getRecipeFoodBudget');
    expect(apiSource).toContain('export function addBudgetQualifiedRecipeShopping');
  });
});
