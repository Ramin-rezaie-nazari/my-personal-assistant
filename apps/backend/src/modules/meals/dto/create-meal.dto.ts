import { IsDateString, IsString } from 'class-validator';

export class CreateMealDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsDateString()
  eatenAt: string;
}
