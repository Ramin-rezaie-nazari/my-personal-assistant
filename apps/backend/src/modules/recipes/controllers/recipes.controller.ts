import {
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
import { CreateRecipeDto } from '../dto/create-recipe.dto';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly matcher: RecipeInventoryMatcherService,
    private readonly globalCountryFood: GlobalCountryFoodService,
  ) {}

  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateRecipeDto,
  ) {
    return this.recipesService.createRecipe(req.user.id, dto);
  }

  @Get()
  async findAll(
    @Request() req: { user: { id: string } },
    @Query('countryCode') countryCode = '',
  ) {
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
