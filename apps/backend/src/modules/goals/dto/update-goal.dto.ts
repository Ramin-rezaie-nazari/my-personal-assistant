import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateGoalDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(50) category?: string;
  @IsOptional() @IsIn(['active', 'completed', 'paused']) status?: 'active' | 'completed' | 'paused';
  @IsOptional() @IsInt() @Min(1) @Max(3) priority?: number;
  @IsOptional() @IsString() @MaxLength(40) targetDate?: string | null;
  @IsOptional() @IsInt() @Min(0) @Max(100) progressPercent?: number;
  @IsOptional() @IsNumber() targetValue?: number | null;
  @IsOptional() @IsNumber() currentValue?: number | null;
  @IsOptional() @IsString() @MaxLength(40) unit?: string | null;
}
