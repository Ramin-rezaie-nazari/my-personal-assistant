import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';

export type RecipePresentationStep = {
  id: string;
  stepNumber: number;
  instruction: string;
  durationSeconds: number | null;
  temperatureC: number | null;
  imageUrl: string | null;
  imageSource: string | null;
  sourceLicense: string | null;
  sourceAttribution: string | null;
};

@Injectable()
export class RecipePresentationService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string, recipeId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, OR: [{ userId: null }, { userId }] },
      include: { ingredients: { include: { food: true } } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const steps = await this.prisma.$queryRaw<RecipePresentationStep[]>(Prisma.sql`
      SELECT
        "id",
        "stepNumber",
        "instruction",
        "durationSeconds",
        "temperatureC",
        "imageUrl",
        "imageSource",
        "sourceLicense",
        "sourceAttribution"
      FROM "RecipeStep"
      WHERE "recipeId" = ${recipeId}
      ORDER BY "stepNumber" ASC
    `);

    return {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      imageSource: recipe.imageSource,
      servings: recipe.servings,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      verified: recipe.verified,
      ingredients: recipe.ingredients.map((ingredient) => ({
        foodId: ingredient.foodId,
        name: ingredient.food.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        measurementKind: ingredient.measurementKind,
      })),
      steps,
      contentCompleteness: {
        hasHeroImage: Boolean(recipe.imageUrl),
        hasInstructions: steps.length > 0,
        instructionStepCount: steps.length,
      },
    };
  }
}
