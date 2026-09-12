import { IsNumber, Max, Min } from 'class-validator';

export class AddWaterDto {
  @IsNumber()
  @Min(1)
  @Max(20000)
  amountMl!: number;
}
