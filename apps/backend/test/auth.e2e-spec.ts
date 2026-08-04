import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';

interface RegisterResponse {
  accessToken: string;
  user: {
    email: string;
  };
}

interface MeResponse {
  email: string;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user', async () => {
    const email = `test-${Date.now()}@example.com`;
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201);

    const body = response.body as RegisterResponse;

    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe(email);
  });

  it('returns current user with valid JWT', async () => {
    const email = `me-${Date.now()}@example.com`;

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Me',
        lastName: 'User',
      })
      .expect(201);

    const accessToken = (registerResponse.body as RegisterResponse).accessToken;

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as MeResponse;

    expect(body.email).toBe(email);
  });
});
