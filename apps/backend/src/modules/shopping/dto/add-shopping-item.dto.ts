import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class AddShoppingItemDto {
  @IsString()
  @MinLength(1)
  foodId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  quantity: number;

  @IsString()
  @MinLength(1)
  unit: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  priority?: string;
}
