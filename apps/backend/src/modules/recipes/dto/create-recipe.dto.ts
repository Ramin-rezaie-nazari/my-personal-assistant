import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const SCALING_POLICIES = [
  'linear',
  'sublinear',
  'fixed',
  'per_batch',
  'manual_review',
] as const;

const MEASUREMENT_KINDS = [
  'mass',
  'volume',
  'count',
  'package',
  'unitless',
] as const;

export class RecipeIngredientDto {
  @IsString()
  @MinLength(1)
  foodId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsIn(MEASUREMENT_KINDS)
  measurementKind?: (typeof MEASUREMENT_KINDS)[number];

  @IsOptional()
  @IsIn(SCALING_POLICIES)
  scalingPolicy?: (typeof SCALING_POLICIES)[number];

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  scalingExponent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  batchSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  maxLinearMultiplier?: number;
}

export class CreateRecipeDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  imageSource?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  servings?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients: RecipeIngredientDto[];
}
