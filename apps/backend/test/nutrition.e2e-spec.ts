import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/create-test-app';

describe('Nutrition API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    app = await createTestApp();

    const email = `nutrition-${Date.now()}@example.com`;
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' })
      .expect(201);

    accessToken = response.body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication for nutrition endpoints', async () => {
    await request(app.getHttpServer()).get('/nutrition').expect(401);
    await request(app.getHttpServer()).get('/nutrition/summary').expect(401);
    await request(app.getHttpServer())
      .post('/nutrition')
      .send({
        mealType: 'lunch',
        title: 'Rice',
      })
      .expect(401);
  });

  it('creates and reads a nutrition log for the authenticated user', async () => {
    const dateKey = '2026-08-11';

    const created = await request(app.getHttpServer())
      .post('/nutrition')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        dateKey,
        mealType: 'lunch',
        title: 'Chicken and rice',
        calories: 650,
        protein: 45,
        carbs: 70,
        fat: 15,
      })
      .expect(201);

    expect(created.body).toMatchObject({
      dateKey,
      mealType: 'lunch',
      title: 'Chicken and rice',
      calories: 650,
      protein: 45,
    });

    const logs = await request(app.getHttpServer())
      .get(`/nutrition?dateKey=${dateKey}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(logs.body).toHaveLength(1);
    expect(logs.body[0]).toMatchObject({ title: 'Chicken and rice', dateKey });

    const summary = await request(app.getHttpServer())
      .get(`/nutrition/summary?dateKey=${dateKey}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(summary.body).toMatchObject({
      dateKey,
      meals: {
        count: 1,
        calories: 650,
        protein: 45,
        carbs: 70,
        fat: 15,
      },
    });
  });

  it('rejects malformed and negative nutrition input', async () => {
    await request(app.getHttpServer())
      .post('/nutrition')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        dateKey: '2026-02-30',
        mealType: 'lunch',
        title: 'Invalid date',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/nutrition')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mealType: 'lunch',
        title: 'Negative calories',
        calories: -10,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/nutrition')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        mealType: ' ',
        title: 'Blank type',
      })
      .expect(400);
  });
});