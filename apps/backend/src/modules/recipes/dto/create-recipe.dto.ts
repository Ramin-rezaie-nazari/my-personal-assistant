import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUrl, Min, MinLength, ValidateNested } from 'class-validator';

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients: RecipeIngredientDto[];
}
