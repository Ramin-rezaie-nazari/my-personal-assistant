import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class FitnessCalculatorDto {
  @IsIn(['male', 'female']) sex!: 'male' | 'female';
  @IsNumber() @Min(13) @Max(100) age!: number;
  @IsNumber() @Min(100) @Max(250) heightCm!: number;
  @IsNumber() @Min(25) @Max(350) weightKg!: number;
  @IsOptional() @IsNumber() @Min(1.1) @Max(2.5) activityFactor?: number;
  @IsOptional() @IsNumber() @Min(2) @Max(70) bodyFatPercent?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(600) workoutMinutes?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(50) workoutCaloriesPerMinute?: number;
  @IsOptional() @IsIn(['low', 'moderate', 'high']) waterActivityLevel?: 'low' | 'moderate' | 'high';
}
