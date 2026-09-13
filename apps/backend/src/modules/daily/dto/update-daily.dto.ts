import { IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class UpdateDailyDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateKey?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  waterMl?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  calories?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  protein?: number;
}
