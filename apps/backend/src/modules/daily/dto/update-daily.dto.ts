import { IsNumber, IsOptional } from 'class-validator';

export class UpdateDailyDto {
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
