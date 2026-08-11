import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateDailyDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateKey?: string;

  @IsOptional()
  @IsNumber()
  waterMl?: number;

  @IsOptional()
  @IsNumber()
  calories?: number;

  @IsOptional()
  @IsNumber()
  protein?: number;
}
