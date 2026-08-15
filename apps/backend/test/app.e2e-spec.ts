import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('supports authenticated recipe creation and retrieval with calculated nutrition', async () => {
    const email = `recipe-${Date.now()}@example.com`;
    const auth = await request(app.getHttpServer()).post('/auth/register').send({ email, password: 'password123' }).expect(201);
    const token = auth.body.accessToken as string;

    const food = await request(app.getHttpServer())
      .post('/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Oats', category: 'grain', calories: 100, protein: 5, carbs: 15, fat: 2 })
      .expect(201);

    const recipe = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Breakfast', ingredients: [{ foodId: food.body.id, quantity: 2, unit: 'g' }] })
      .expect(201);

    expect(recipe.body.name).toBe('Test Breakfast');
    expect(recipe.body.calories).toBe(200);
    expect(recipe.body.protein).toBe(10);

    await request(app.getHttpServer()).get(`/recipes/${recipe.body.id}`).set('Authorization', `Bearer ${token}`).expect(200);
    const list = await request(app.getHttpServer()).get('/recipes').set('Authorization', `Bearer ${token}`).expect(200);
    expect(list.body.some((item: { id: string }) => item.id === recipe.body.id)).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
