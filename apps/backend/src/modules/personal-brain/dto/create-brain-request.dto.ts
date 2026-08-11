import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBrainRequestDto {
  @IsString()
  @IsNotEmpty()
  message!: string;
}
