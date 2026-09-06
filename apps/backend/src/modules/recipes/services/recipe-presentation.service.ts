import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class RecipePresentationService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string, recipeId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, OR: [{ userId: null }, { userId }] },
      include: {
        ingredients: { include: { food: true } },
        steps: { orderBy: { stepNumber: 'asc' } },
        media: { where: { status: 'approved' }, orderBy: { position: 'asc' } },
      },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

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
        id: ingredient.id,
        foodId: ingredient.foodId,
        name: ingredient.food.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        measurementKind: ingredient.measurementKind,
        imageUrl: ingredient.food.imageUrl,
      })),
      media: recipe.media.map((media) => ({
        id: media.id,
        position: media.position,
        url: media.url,
        sourceUrl: media.sourceUrl,
        sourceProvider: media.sourceProvider,
        license: media.license,
        attribution: media.attribution,
        mimeType: media.mimeType,
        width: media.width,
        height: media.height,
      })),
      steps: recipe.steps.map((step) => ({
        id: step.id,
        stepNumber: step.stepNumber,
        instruction: step.instruction,
        durationSeconds: step.durationSeconds,
        temperatureC: step.temperatureC,
        imageUrl: step.imageUrl,
        imageSource: step.imageSource,
        sourceLicense: step.sourceLicense,
        sourceAttribution: step.sourceAttribution,
      })),
      contentCompleteness: {
        hasHeroImage: Boolean(recipe.imageUrl),
        galleryImageCount: recipe.media.length,
        hasInstructions: recipe.steps.length > 0,
        instructionStepCount: recipe.steps.length,
      },
    };
  }
}
