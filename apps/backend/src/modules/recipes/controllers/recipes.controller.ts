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
import { GlobalCountryFoodService } from '../services/global-country-food.service';
import { FoodOperatingLoopService } from '../services/food-operating-loop.service';
import { RecipeShoppingConsolidationService } from '../services/recipe-shopping-consolidation.service';
import { CreateRecipeDto } from '../dto/create-recipe.dto';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly matcher: RecipeInventoryMatcherService,
    private readonly globalCountryFood: GlobalCountryFoodService,
    private readonly foodOperatingLoop: FoodOperatingLoopService,
    private readonly shoppingConsolidation: RecipeShoppingConsolidationService,
  ) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateRecipeDto) {
    return this.recipesService.createRecipe(req.user.id, dto);
  }

  @Get()
  async findAll(@Request() req: { user: { id: string } }, @Query('countryCode') countryCode = '') {
    const recipes = await this.recipesService.getRecipes(req.user.id);
    return this.globalCountryFood.rankRecipesForCountry(countryCode, recipes);
  }

  @Get('local')
  local(@Query('countryCode') countryCode = '') {
    return this.globalCountryFood.getLocalRecipeGuidance(countryCode);
  }

  @Get('countries')
  countries() {
    return this.globalCountryFood.getSupportedCountryCodes();
  }

  @Get('match')
  match(@Request() req: { user: { id: string } }) {
    return this.matcher.match(req.user.id);
  }

  @Get('recommendations')
  recommendations(
    @Request() req: { user: { id: string } },
    @Query('servings') servingsText?: string,
    @Query('countryCode') countryCode = '',
    @Query('maxCalories') maxCaloriesText?: string,
    @Query('minProteinGrams') minProteinText?: string,
  ) {
    const servings = parseRequiredServings(servingsText);
    const maxCalories = parseOptionalNonNegative(maxCaloriesText, 'maxCalories');
    const minProteinGrams = parseOptionalNonNegative(minProteinText, 'minProteinGrams');
    return this.foodOperatingLoop.recommend(req.user.id, servings, countryCode, maxCalories, minProteinGrams);
  }

  @Get('meal-plan')
  async mealPlan(
    @Request() req: { user: { id: string } },
    @Query('servings') servingsText?: string,
    @Query('countryCode') countryCode = '',
    @Query('maxCalories') maxCaloriesText?: string,
    @Query('minProteinGrams') minProteinText?: string,
  ) {
    const servings = parseRequiredServings(servingsText);
    const maxCalories = parseOptionalNonNegative(maxCaloriesText, 'maxCalories');
    const minProteinGrams = parseOptionalNonNegative(minProteinText, 'minProteinGrams');
    const recommendations = await this.foodOperatingLoop.recommend(req.user.id, servings, countryCode, maxCalories, minProteinGrams);
    const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
    const used = new Set<string>();
    const meals = mealTypes.map((mealType, index) => {
      const recipe = recommendations.find((item) => !used.has(item.recipeId)) ?? recommendations[index] ?? null;
      if (recipe) used.add(recipe.recipeId);
      return { mealType, recipe };
    });
    return { targetServings: servings, countryCode: countryCode.trim().toUpperCase() || null, meals, generatedDeterministically: true };
  }

  @Post('shopping/consolidate')
  consolidateShopping(
    @Request() req: { user: { id: string } },
    @Body() body: { recipes: Array<{ recipeId: string; servings: number }>; countryCode?: string },
  ) {
    if (!Array.isArray(body.recipes) || body.recipes.length === 0) {
      throw new BadRequestException('recipes must contain at least one recipe');
    }
    return this.shoppingConsolidation.build(req.user.id, body.recipes, body.countryCode ?? '');
  }

  @Get(':id/food-plan')
  foodPlan(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Query('servings') servingsText?: string,
    @Query('countryCode') countryCode = '',
  ) {
    const servings = parseRequiredServings(servingsText);
    return this.foodOperatingLoop.buildPlan(req.user.id, id, servings, countryCode);
  }

  @Post(':id/food-plan/shopping')
  addFoodPlanMissingToShopping(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Query('servings') servingsText?: string,
  ) {
    const servings = parseRequiredServings(servingsText);
    return this.foodOperatingLoop.addMissingToShopping(req.user.id, id, servings);
  }

  @Get(':id/scaled')
  scale(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Query('servings') servingsText?: string,
  ) {
    const servings = parseRequiredServings(servingsText);
    return this.recipesService.getScaledRecipe(req.user.id, id, servings);
  }

  @Get(':id')
  findOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.recipesService.getRecipe(req.user.id, id);
  }

  @Patch(':id')
  update(@Request() req: { user: { id: string } }, @Param('id') id: string, @Body() body: Partial<CreateRecipeDto>) {
    return this.recipesService.updateRecipe(req.user.id, id, body);
  }

  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.recipesService.deleteRecipe(req.user.id, id);
  }
}

function parseRequiredServings(value?: string): number {
  if (!value?.trim()) throw new BadRequestException('servings is required');
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new BadRequestException('servings must be a positive integer');
  return parsed;
}

function parseOptionalNonNegative(value: string | undefined, name: string): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new BadRequestException(`${name} must be a non-negative number`);
  return parsed;
}
