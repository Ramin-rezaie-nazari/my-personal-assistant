import { Injectable } from '@nestjs/common';

@Injectable()
export class RecipesService {
  async createRecipe() {
    await Promise.resolve();

    return {
      message: 'Recipe created',
    };
  }

  async getRecipes() {
    await Promise.resolve();

    return [];
  }
}
