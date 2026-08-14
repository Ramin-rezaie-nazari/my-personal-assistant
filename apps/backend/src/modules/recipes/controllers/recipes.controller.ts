import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecipesService } from '../services/recipes.service';
import { RecipeInventoryMatcherService } from '../services/recipe-inventory-matcher.service';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService, private readonly matcher: RecipeInventoryMatcherService) {}

  @Post()
  create() { return this.recipesService.createRecipe(); }

  @Get()
  findAll() { return this.recipesService.getRecipes(); }

  @Get('match')
  match(@Request() req: { user: { id: string } }) { return this.matcher.match(req.user.id); }
}
