import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateHabitDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsIn(['daily', 'weekly'])
  frequency!: 'daily' | 'weekly';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  targetPerWeek?: number;
}

export class UpdateHabitDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(['daily', 'weekly'])
  frequency?: 'daily' | 'weekly';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  targetPerWeek?: number;

  @IsOptional()
  active?: boolean;
}
