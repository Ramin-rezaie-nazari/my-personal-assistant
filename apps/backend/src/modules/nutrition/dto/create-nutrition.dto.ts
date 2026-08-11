import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class CreateNutritionDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateKey?: string;

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
