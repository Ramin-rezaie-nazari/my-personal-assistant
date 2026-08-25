import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ConfirmAssistantRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;
}
