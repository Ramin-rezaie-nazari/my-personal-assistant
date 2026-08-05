import { Controller, Get, Post } from '@nestjs/common';
import { RecipesService } from '../services/recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  create() {
    return this.recipesService.createRecipe();
  }

  @Get()
  findAll() {
    return this.recipesService.getRecipes();
  }
}
