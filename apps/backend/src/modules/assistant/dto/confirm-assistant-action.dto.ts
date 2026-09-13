import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ConfirmAssistantActionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(16)
  @MaxLength(512)
  token!: string;
}
