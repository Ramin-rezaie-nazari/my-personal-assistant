import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateGoalDto {
  @IsString() @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(50) category?: string;
  @IsOptional() @IsInt() @Min(1) @Max(3) priority?: number;
  @IsOptional() @IsString() @MaxLength(40) targetDate?: string;
  @IsOptional() @IsNumber() targetValue?: number;
  @IsOptional() @IsNumber() currentValue?: number;
  @IsOptional() @IsString() @MaxLength(40) unit?: string;
}
