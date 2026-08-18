import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecipesService } from '../services/recipes.service';
import { RecipeInventoryMatcherService } from '../services/recipe-inventory-matcher.service';
import { CreateRecipeDto } from '../dto/create-recipe.dto';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly matcher: RecipeInventoryMatcherService,
  ) {}

  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateRecipeDto,
  ) {
    return this.recipesService.createRecipe(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.recipesService.getRecipes(req.user.id);
  }

  @Get('match')
  match(@Request() req: { user: { id: string } }) {
    return this.matcher.match(req.user.id);
  }

  /**
   * Returns a cookable version of a stored recipe for the requested number of
   * people. The serving count is deliberately required: callers must never
   * silently assume the wrong household size.
   */
  @Get(':id/scaled')
  scale(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Query('servings') servingsText?: string,
  ) {
    if (!servingsText?.trim())
      throw new BadRequestException('servings is required');

    const servings = Number(servingsText);
    if (!Number.isInteger(servings) || servings <= 0)
      throw new BadRequestException('servings must be a positive integer');

    return this.recipesService.getScaledRecipe(req.user.id, id, servings);
  }

  @Get(':id')
  findOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.recipesService.getRecipe(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: Partial<CreateRecipeDto>,
  ) {
    return this.recipesService.updateRecipe(req.user.id, id, body);
  }

  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.recipesService.deleteRecipe(req.user.id, id);
  }
}
