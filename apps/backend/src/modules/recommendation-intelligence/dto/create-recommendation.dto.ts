import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRecommendationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  targetServings!: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  countryCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxCalories?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minProteinGrams?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxMissingIngredients?: number;
}
