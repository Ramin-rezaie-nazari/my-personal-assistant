import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class AddToBasketDto {
  @IsUUID()
  foodId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsNumber()
  @Min(0.001)
  @Max(1000000)
  quantity!: number;

  @IsString()
  @MaxLength(32)
  unit!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  source?: string;

  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'critical'])
  priority?: string;
}

export class RecipeMissingItemDto {
  @IsUUID()
  foodId!: string;

  @IsNumber()
  @Min(0.001)
  @Max(1000000)
  quantity!: number;

  @IsString()
  @MaxLength(32)
  unit!: string;
}

export class AddRecipeMissingDto {
  @IsUUID()
  recipeId!: string;

  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => RecipeMissingItemDto)
  items!: RecipeMissingItemDto[];
}

export class AdjustInventoryDto {
  @IsNumber()
  @Min(0)
  @Max(1000000)
  quantity!: number;
}
