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
