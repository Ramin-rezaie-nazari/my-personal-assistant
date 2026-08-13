import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateRecipeDto } from '../dto/create-recipe.dto';
import { RecipesService } from '../services/recipes.service';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateRecipeDto) {
    return this.recipesService.createRecipe(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.recipesService.getRecipes(req.user.id);
  }
}
