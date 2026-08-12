import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @IsIn(['fa', 'en'])
  @MaxLength(10)
  language?: 'fa' | 'en';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
