import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateNutritionDto {
  @IsString()
  mealType: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  calories?: number;

  @IsOptional()
  @IsNumber()
  protein?: number;

  @IsOptional()
  @IsNumber()
  carbs?: number;

  @IsOptional()
  @IsNumber()
  fat?: number;
}
