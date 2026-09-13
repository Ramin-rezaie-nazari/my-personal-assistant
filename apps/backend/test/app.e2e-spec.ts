import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/create-test-app';
import { httpRequest } from './helpers/http-request';

describe('API e2e', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  it('exposes the public health liveness endpoint', async () => {
    const response = await httpRequest(baseUrl, 'GET', '/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('My Personal Assistant API');
  });

  it('does not expose the obsolete public root Hello World endpoint', async () => {
    const response = await httpRequest(baseUrl, 'GET', '/');
    expect(response.status).toBe(404);
  });

  it('supports authenticated recipe creation and retrieval with calculated nutrition', async () => {
    const email = `recipe-${Date.now()}@example.com`;
    const auth = await httpRequest(baseUrl, 'POST', '/auth/register', { body: { email, password: 'password123' } });
    expect(auth.status).toBe(201);
    const token = auth.body.accessToken as string;
    const headers = { Authorization: `Bearer ${token}` };

    const food = await httpRequest(baseUrl, 'POST', '/foods', {
      headers,
      body: { name: 'Test Oats', category: 'grain', calories: 100, protein: 5, carbs: 15, fat: 2 },
    });
    expect(food.status).toBe(201);

    const recipe = await httpRequest(baseUrl, 'POST', '/recipes', {
      headers,
      body: { name: 'Test Breakfast', ingredients: [{ foodId: food.body.id, quantity: 2, unit: 'g' }] },
    });
    expect(recipe.status).toBe(201);
    expect(recipe.body.name).toBe('Test Breakfast');
    expect(recipe.body.calories).toBe(200);
    expect(recipe.body.protein).toBe(10);

    expect((await httpRequest(baseUrl, 'GET', `/recipes/${recipe.body.id}`, { headers })).status).toBe(200);
    const list = await httpRequest(baseUrl, 'GET', '/recipes', { headers });
    expect(list.status).toBe(200);
    expect(list.body.some((item: { id: string }) => item.id === recipe.body.id)).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
