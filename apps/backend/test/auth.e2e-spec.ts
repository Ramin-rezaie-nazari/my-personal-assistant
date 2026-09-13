import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/create-test-app';
import { httpRequest } from './helpers/http-request';

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
    const email = `test-${Date.now()}@example.com`;
    const response = await httpRequest(baseUrl, 'POST', '/auth/register', {
      body: {
        email,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    expect(response.status).toBe(201);
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
    const response = await httpRequest(baseUrl, 'GET', '/auth/me', {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    expect(response.status).toBe(200);
    const body = response.body as MeResponse;
    expect(body.email).toBe(auth.user.email);
  });

  it('rotates the refresh token and rejects reuse of the previous token', async () => {
    const auth = await registerUser();
    const response = await httpRequest(baseUrl, 'POST', '/auth/refresh', {
      body: { refreshToken: auth.refreshToken },
    });
    expect(response.status).toBe(201);
    const rotated = response.body as AuthResponse;
    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(auth.refreshToken);

    const reused = await httpRequest(baseUrl, 'POST', '/auth/refresh', {
      body: { refreshToken: auth.refreshToken },
    });
    expect(reused.status).toBe(401);

    const rotatedAgain = await httpRequest(baseUrl, 'POST', '/auth/refresh', {
      body: { refreshToken: rotated.refreshToken },
    });
    expect(rotatedAgain.status).toBe(201);
  });

  it('logs out user with refresh token', async () => {
    const auth = await registerUser();
    const response = await httpRequest(baseUrl, 'POST', '/auth/logout', {
      body: { refreshToken: auth.refreshToken },
    });
    expect(response.status).toBe(201);
    const body = response.body as LogoutResponse;
    expect(body.message).toBeDefined();
  });

  it('rejects protected route without token', async () => {
    const response = await httpRequest(baseUrl, 'GET', '/auth/me');
    expect(response.status).toBe(401);
  });
});
