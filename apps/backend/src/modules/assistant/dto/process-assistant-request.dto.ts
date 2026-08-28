import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class ProcessAssistantRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}(?:-[A-Z]{2}|-[A-Z][a-z]{2})$/)
  locale?: string;
}
