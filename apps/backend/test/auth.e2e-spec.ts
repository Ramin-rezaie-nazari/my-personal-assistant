import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
  };
}

interface MeResponse {
  email: string;
}

interface LogoutResponse {
  message: string;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerUser() {
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

    return response.body as AuthResponse;
  }

  it('registers a new user', async () => {
    const body = await registerUser();

    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user.email).toContain('@example.com');
  });

  it('returns current user with valid JWT', async () => {
    const auth = await registerUser();

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(200);

    const body = response.body as MeResponse;

    expect(body.email).toBe(auth.user.email);
  });

  it('rotates the refresh token and rejects reuse of the previous token', async () => {
    const auth = await registerUser();

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: auth.refreshToken,
      })
      .expect(201);

    const rotated = response.body as AuthResponse;

    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(auth.refreshToken);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: auth.refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: rotated.refreshToken })
      .expect(201);
  });

  it('logs out user with refresh token', async () => {
    const auth = await registerUser();

    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken: auth.refreshToken,
      })
      .expect(201);

    const body = response.body as LogoutResponse;

    expect(body.message).toBeDefined();
  });

  it('rejects protected route without token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});