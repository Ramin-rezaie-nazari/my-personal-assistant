import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateReminderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  type!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  time!: string;
}
