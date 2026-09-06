import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const genders = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
const goals = ['fat_loss', 'body_sculpt', 'strength', 'general_fitness'] as const;
const fitnessLevels = ['beginner', 'foundation', 'intermediate', 'advanced'] as const;
const diets = ['balanced', 'high_protein', 'vegetarian', 'vegan', 'halal'] as const;
const workoutPlaces = ['home', 'gym', 'both'] as const;
const equipment = ['none', 'home', 'gym'] as const;

export class SaveOnboardingDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsString()
  @IsIn(genders)
  gender!: (typeof genders)[number];

  @IsDateString()
  birthDate!: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(90)
  @Max(250)
  heightCm!: number;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(25)
  @Max(350)
  weightKg!: number;

  @IsIn(goals)
  goal!: (typeof goals)[number];

  @IsIn(fitnessLevels)
  fitnessLevel!: (typeof fitnessLevels)[number];

  @IsIn(diets)
  diet!: (typeof diets)[number];

  @IsIn(workoutPlaces)
  workoutPlace!: (typeof workoutPlaces)[number];

  @IsIn([2, 3, 4, 5, 6])
  @IsInt()
  trainingDaysPerWeek!: 2 | 3 | 4 | 5 | 6;

  @IsIn(equipment)
  equipment!: (typeof equipment)[number];

  @IsIn([20, 30, 45, 60])
  @IsInt()
  sessionMinutes!: 20 | 30 | 45 | 60;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  detectedCountry?: string;

  @IsBoolean()
  notificationsEnabled!: boolean;

  @IsOptional()
  @IsBoolean()
  locationPermissionGranted?: boolean;

  @IsOptional()
  @IsBoolean()
  cameraPermissionGranted?: boolean;

  @IsOptional()
  @IsBoolean()
  microphonePermissionGranted?: boolean;
}