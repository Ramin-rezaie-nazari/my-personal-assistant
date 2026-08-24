import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { PrismaService } from '../src/common/database/prisma.service';

type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string };
};

describe('Recommendation Intelligence (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer())
      .post('/recommendation-intelligence/food')
      .send({ context: 'high protein dinner' })
      .expect(401);
  });

  it('returns deterministic ranked food recommendations with explanations', async () => {
    const email = `recommendation-${Date.now()}@example.com`;
    const authResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Recommendation',
        lastName: 'Test',
      })
      .expect(201);
    const auth = authResponse.body as AuthResponse;

    const food = await prisma.foodItem.create({
      data: {
        userId: auth.user.id,
        name: 'Chickpea',
        category: 'legume',
        calories: 164,
        protein: 17.8,
        carbs: 27,
        fat: 5.2,
        verified: true,
      },
    });

    await prisma.recipe.create({
      data: {
        userId: auth.user.id,
        name: 'Chickpea Salad',
        description: 'High protein salad for dinner',
        servings: 2,
        calories: 700,
        protein: 80,
        carbs: 90,
        fat: 12,
        verified: true,
        ingredients: {
          create: [
            {
              foodId: food.id,
              quantity: 200,
              unit: 'g',
              measurementKind: 'mass',
              scalingPolicy: 'linear',
              calories: 328,
              protein: 35.6,
              carbs: 54,
              fat: 5.2,
            },
          ],
        },
      },
    });

    await prisma.inventoryItem.create({
      data: {
        userId: auth.user.id,
        foodId: food.id,
        quantity: 500,
        unit: 'g',
      },
    });

    await prisma.nutritionProfile.upsert({
      where: { userId: auth.user.id },
      update: {
        dailyCaloriesGoal: 2000,
        proteinGoalGrams: 120,
        dietType: 'vegetarian',
      },
      create: {
        userId: auth.user.id,
        dailyCaloriesGoal: 2000,
        proteinGoalGrams: 120,
        dietType: 'vegetarian',
      },
    });

    const response = await request(app.getHttpServer())
      .post('/recommendation-intelligence/food')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        category: 'salad',
        goal: 'high protein',
        context: 'healthy dinner',
        targetServings: 2,
        maxMissingIngredients: 0,
        limit: 5,
      })
      .expect(201);

    expect(response.body.generatedDeterministically).toBe(true);
    expect(response.body.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipeId: expect.any(String),
          name: 'Chickpea Salad',
          score: expect.any(Number),
          scoreBreakdown: expect.objectContaining({
            baseFoodOperatingLoop: expect.any(Number),
            inventoryCoverage: expect.any(Number),
            intentMatch: expect.any(Number),
          }),
          reasons: expect.any(Array),
        }),
      ]),
    );

    await prisma.recipe.deleteMany({ where: { userId: auth.user.id } });
    await prisma.inventoryItem.deleteMany({ where: { userId: auth.user.id } });
    await prisma.nutritionProfile.deleteMany({ where: { userId: auth.user.id } });
    await prisma.foodItem.deleteMany({ where: { id: food.id } });
  });
});
