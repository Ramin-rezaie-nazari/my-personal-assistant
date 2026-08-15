import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateMealItemDto {
  @IsString()
  @MinLength(1)
  foodId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CreateMealDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  type: string;

  @IsDateString()
  eatenAt: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateKey?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMealItemDto)
  items: CreateMealItemDto[];
}
