import { IsNumber, Max, Min } from 'class-validator';

export class AdjustInventoryDto {
  @IsNumber()
  @Min(0)
  @Max(1000000)
  quantity!: number;
}
