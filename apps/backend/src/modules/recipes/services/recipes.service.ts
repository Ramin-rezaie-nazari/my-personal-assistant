import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateRecipeDto } from '../dto/create-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRecipe(userId: string, dto: CreateRecipeDto) {
    const foodIds = [...new Set(dto.ingredients.map((ingredient) => ingredient.foodId))];
    const foods = await this.prisma.foodItem.findMany({
      where: { id: { in: foodIds }, OR: [{ userId: null }, { userId }] },
    });

    if (foods.length !== foodIds.length) {
      throw new BadRequestException('One or more recipe ingredients are invalid');
    }

    const foodById = new Map(foods.map((food) => [food.id, food]));
    const nutrition = dto.ingredients.reduce(
      (totals, ingredient) => {
        const food = foodById.get(ingredient.foodId)!;
        totals.calories += food.calories * ingredient.quantity;
        totals.protein += food.protein * ingredient.quantity;
        totals.carbs += food.carbs * ingredient.quantity;
        totals.fat += food.fat * ingredient.quantity;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return this.prisma.recipe.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        calories: Math.round(nutrition.calories),
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        verified: false,
        ingredients: {
          create: dto.ingredients.map((ingredient) => {
            const food = foodById.get(ingredient.foodId)!;
            return {
              foodId: ingredient.foodId,
              quantity: ingredient.quantity,
              unit: ingredient.unit ?? 'g',
              calories: Math.round(food.calories * ingredient.quantity),
              protein: food.protein * ingredient.quantity,
              carbs: food.carbs * ingredient.quantity,
              fat: food.fat * ingredient.quantity,
            };
          }),
        },
      },
      include: { ingredients: { include: { food: true } } },
    });
  }

  async getRecipes(userId: string) {
    return this.prisma.recipe.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      include: { ingredients: { include: { food: true } } },
      orderBy: [{ verified: 'desc' }, { name: 'asc' }],
    });
  }
}
