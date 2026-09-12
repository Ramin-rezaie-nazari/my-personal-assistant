import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/create-test-app';
import { httpRequest } from './helpers/http-request';

describe('Backend API contract (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerUser() {
    const email = `api-contract-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const response = await httpRequest(baseUrl, 'POST', '/auth/register', {
      body: {
        email,
        password: 'StrongPassword123!',
        firstName: 'Test',
      },
    });
    expect(response.status).toBe(201);
    return response.body as { accessToken: string; user: { id: string; email: string } };
  }

  it('serves the public health endpoint', async () => {
    const response = await httpRequest(baseUrl, 'GET', '/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ status: 'ok' }),
    );
  });

  it('does not expose the obsolete public root Hello World endpoint', async () => {
    const response = await httpRequest(baseUrl, 'GET', '/');
    expect(response.status).toBe(404);
  });

  it.each([
    ['GET', '/users/profile'],
    ['GET', '/settings'],
    ['GET', '/profile'],
    ['GET', '/calendar'],
    ['GET', '/reminders'],
    ['GET', '/notifications'],
    ['GET', '/assistant/history'],
    ['GET', '/shopping-intelligence'],
    ['GET', '/budget-intelligence/plan?budget=100&currency=USD'],
    ['POST', '/assistant'],
    ['POST', '/calendar'],
    ['POST', '/reminders'],
    ['POST', '/notifications'],
  ])('rejects unauthenticated %s %s', async (method, path) => {
    const response = await httpRequest(baseUrl, method, path, {
      body: method === 'GET' ? undefined : {},
    });
    expect(response.status).toBe(401);
  });

  it('serves the authenticated shopping intelligence plan for the current user', async () => {
    const auth = await registerUser();
    const response = await httpRequest(baseUrl, 'GET', '/shopping-intelligence', {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        userId: auth.user.id,
        generatedDeterministically: true,
        counts: expect.objectContaining({
          recommended: expect.any(Number),
          openBasket: expect.any(Number),
        }),
      }),
    );
  });

  it('serves the authenticated budget plan for the current user', async () => {
    const auth = await registerUser();
    const response = await httpRequest(
      baseUrl,
      'GET',
      '/budget-intelligence/plan?budget=15000000&currency=IRT',
      { headers: { Authorization: `Bearer ${auth.accessToken}` } },
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        userId: auth.user.id,
        budget: 15000000,
        currency: 'IRT',
        generatedDeterministically: true,
        items: expect.any(Array),
      }),
    );
  });

  it('keeps the assistant status endpoint public', async () => {
    const response = await httpRequest(baseUrl, 'GET', '/assistant');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ status: expect.any(String) }),
    );
  });

  it('rejects unknown DTO fields at the HTTP boundary', async () => {
    const response = await httpRequest(baseUrl, 'POST', '/auth/register', {
      body: {
        email: `api-contract-${Date.now()}@example.com`,
        password: 'StrongPassword123!',
        firstName: 'Test',
        unexpected: 'must-not-be-accepted',
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('property unexpected should not exist'),
      ]),
    );
  });
});
