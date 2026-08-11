import { IsNotEmpty, IsString } from 'class-validator';

export class ProcessAssistantRequestDto {
  @IsString()
  @IsNotEmpty()
  message!: string;
}
