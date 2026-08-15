import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createApp } from '../src/bootstrap';

describe('Backend API contract (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the public health endpoint', async () => {
    await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it.each([
    ['GET', '/users/profile'],
    ['GET', '/settings'],
    ['GET', '/profile'],
    ['GET', '/calendar'],
    ['GET', '/reminders'],
    ['GET', '/notifications'],
    ['GET', '/assistant/history'],
    ['POST', '/assistant'],
    ['POST', '/calendar'],
    ['POST', '/reminders'],
    ['POST', '/notifications'],
  ])('rejects unauthenticated %s %s', async (method, path) => {
    const req = request(app.getHttpServer());
    const response = method === 'GET' ? await req.get(path) : await req.post(path).send({});
    expect(response.status).toBe(401);
  });

  it('keeps the assistant status endpoint public', async () => {
    const response = await request(app.getHttpServer()).get('/assistant');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ status: expect.any(String) }));
  });

  it('rejects unknown DTO fields at the HTTP boundary', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `api-contract-${Date.now()}@example.com`,
        password: 'StrongPassword123!',
        firstName: 'Test',
        unexpected: 'must-not-be-accepted',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(expect.arrayContaining([expect.stringContaining('property unexpected should not exist')]));
  });
});
