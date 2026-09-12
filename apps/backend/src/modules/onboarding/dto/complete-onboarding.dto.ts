import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CompleteOnboardingDto {
  @IsOptional() @IsString() @MaxLength(50)
  currentStep?: string;

  @IsOptional() @IsString() @MaxLength(120)
  fullName?: string;

  @IsOptional() @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  @IsOptional() @IsDateString()
  birthDate?: string;

  @IsOptional() @IsInt() @Min(90) @Max(250)
  heightCm?: number;

  @IsOptional() @IsInt() @Min(25) @Max(350)
  weightKg?: number;

  @IsOptional() @IsIn(['fat_loss', 'body_sculpt', 'strength', 'general_fitness'])
  goal?: 'fat_loss' | 'body_sculpt' | 'strength' | 'general_fitness';

  @IsOptional() @IsIn(['beginner', 'foundation', 'intermediate', 'advanced'])
  fitnessLevel?: 'beginner' | 'foundation' | 'intermediate' | 'advanced';

  @IsOptional() @IsIn(['balanced', 'high_protein', 'vegetarian', 'vegan', 'halal'])
  diet?: 'balanced' | 'high_protein' | 'vegetarian' | 'vegan' | 'halal';

  @IsOptional() @IsString() @MaxLength(120)
  detectedCountry?: string;
}
