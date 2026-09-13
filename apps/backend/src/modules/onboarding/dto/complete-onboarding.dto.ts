import { IsIn, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class CompleteOnboardingDto {
  @IsOptional()
  @IsString()
  currentStep?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(400)
  weightKg?: number;

  @IsOptional()
  @IsString()
  primaryGoal?: string;

  @IsOptional()
  @IsString()
  fitnessLevel?: string;

  @IsOptional()
  @IsString()
  dietType?: string;

  @IsOptional()
  @IsString()
  workoutPlace?: string;

  @IsOptional()
  @IsString()
  rhythm?: string;

  @IsOptional()
  @IsString()
  detectedCountry?: string;

  @IsOptional()
  @IsString()
  @IsIn(['none', 'home', 'gym'])
  equipment?: string;

  @IsOptional()
  @IsNumber()
  @IsIn([20, 30, 45, 60])
  sessionMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(6)
  trainingDaysPerWeek?: number;
}
