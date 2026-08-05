import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateHealthProfileDto {
  @IsOptional()
  @IsInt()
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @IsOptional()
  @IsInt()
  age?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  activityLevel?: string;

  @IsOptional()
  @IsNumber()
  targetWeightKg?: number;
}
