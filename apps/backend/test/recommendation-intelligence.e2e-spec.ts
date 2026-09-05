import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';

describe('Recommendation Intelligence (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('returns deterministic personalized food recommendations', async () => {
    const email = `recommendation-${Date.now()}@example.com`;
    const auth = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' })
      .expect(201);
    const token = auth.body.accessToken as string;

    const food = await request(app.getHttpServer())
      .post('/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Chicken',
        category: 'protein',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Chicken Bowl',
        servings: 2,
        ingredients: [{ foodId: food.body.id, quantity: 200, unit: 'g' }],
      })
      .expect(201);

    const result = await request(app.getHttpServer())
      .post('/recommendation-intelligence/food')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetServings: 2, countryCode: 'IR' })
      .expect(201);

    expect(result.body.generatedDeterministically).toBe(true);
    expect(result.body.countryCode).toBe('IR');
    expect(result.body.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Test Chicken Bowl',
          targetServings: 2,
        }),
      ]),
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
