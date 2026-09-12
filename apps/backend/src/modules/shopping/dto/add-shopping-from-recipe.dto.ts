import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsPositive, IsString, MinLength, ValidateNested } from 'class-validator';

export class RecipeShoppingItemDto {
  @IsString()
  @MinLength(1)
  foodId: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  quantity: number;

  @IsString()
  @MinLength(1)
  unit: string;
}

export class AddShoppingFromRecipeDto {
  @IsString()
  @MinLength(1)
  recipeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeShoppingItemDto)
  items: RecipeShoppingItemDto[];
}
