import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/create-test-app';
import { httpRequest } from './helpers/http-request';

describe('Nutrition API (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let accessToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    baseUrl = await app.getUrl();

    const email = `nutrition-${Date.now()}@example.com`;
    const response = await httpRequest(baseUrl, 'POST', '/auth/register', {
      body: { email, password: 'password123' },
    });
    expect(response.status).toBe(201);
    accessToken = response.body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication for nutrition endpoints', async () => {
    expect((await httpRequest(baseUrl, 'GET', '/nutrition')).status).toBe(401);
    expect((await httpRequest(baseUrl, 'GET', '/nutrition/summary')).status).toBe(401);
    expect((await httpRequest(baseUrl, 'POST', '/nutrition', { body: { mealType: 'lunch', title: 'Rice' } })).status).toBe(401);
  });

  it('creates and reads a nutrition log for the authenticated user', async () => {
    const dateKey = '2026-08-11';
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    const created = await httpRequest(baseUrl, 'POST', '/nutrition', {
      headers: authHeaders,
      body: {
        dateKey,
        mealType: 'lunch',
        title: 'Chicken and rice',
        calories: 650,
        protein: 45,
        carbs: 70,
        fat: 15,
      },
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ dateKey, mealType: 'lunch', title: 'Chicken and rice', calories: 650, protein: 45 });

    const logs = await httpRequest(baseUrl, 'GET', `/nutrition?dateKey=${dateKey}`, { headers: authHeaders });
    expect(logs.status).toBe(200);
    expect(logs.body).toHaveLength(1);
    expect(logs.body[0]).toMatchObject({ title: 'Chicken and rice', dateKey });

    const summary = await httpRequest(baseUrl, 'GET', `/nutrition/summary?dateKey=${dateKey}`, { headers: authHeaders });
    expect(summary.status).toBe(200);
    expect(summary.body).toMatchObject({ dateKey, meals: { count: 1, calories: 650, protein: 45, carbs: 70, fat: 15 } });
  });

  it('rejects malformed and negative nutrition input', async () => {
    const headers = { Authorization: `Bearer ${accessToken}` };
    expect((await httpRequest(baseUrl, 'POST', '/nutrition', { headers, body: { dateKey: '2026-02-30', mealType: 'lunch', title: 'Invalid date' } })).status).toBe(400);
    expect((await httpRequest(baseUrl, 'POST', '/nutrition', { headers, body: { mealType: 'lunch', title: 'Negative calories', calories: -10 } })).status).toBe(400);
    expect((await httpRequest(baseUrl, 'POST', '/nutrition', { headers, body: { mealType: ' ', title: 'Blank type' } })).status).toBe(400);
  });
});
