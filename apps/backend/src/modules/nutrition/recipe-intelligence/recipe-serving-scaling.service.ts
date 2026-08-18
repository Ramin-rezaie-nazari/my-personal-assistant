import { Injectable } from '@nestjs/common';
import {
  RecipeContract,
  RecipeScalingContext,
  ScaledRecipeResult,
  scaleRecipe,
} from './recipe-domain.types';

/**
 * Application boundary for recipe serving scaling.
 *
 * Controllers, Brain services and future ingestion pipelines should use this
 * service rather than implementing their own quantity math. This keeps the
 * scaling contract deterministic and prevents clients from drifting apart.
 */
@Injectable()
export class RecipeServingScalingService {
  scale(recipe: RecipeContract, context: RecipeScalingContext): ScaledRecipeResult {
    return scaleRecipe(recipe, context);
  }
}
