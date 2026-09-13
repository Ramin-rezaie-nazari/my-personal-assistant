import { IsNotEmpty, IsString } from 'class-validator';

export class DecisionConfirmDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
