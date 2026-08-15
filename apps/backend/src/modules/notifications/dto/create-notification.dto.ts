import { IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  body?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  type!: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  priority?: number;
}
