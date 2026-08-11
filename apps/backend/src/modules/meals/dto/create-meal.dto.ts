import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateMealItemDto {
  @IsString()
  foodId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CreateMealDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsDateString()
  eatenAt: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateKey?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealItemDto)
  items: CreateMealItemDto[];
}
