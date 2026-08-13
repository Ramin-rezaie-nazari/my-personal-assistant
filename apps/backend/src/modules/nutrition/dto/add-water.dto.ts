import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class AddWaterDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateKey?: string;

  @IsInt()
  @Min(1)
  waterMl: number;
}
