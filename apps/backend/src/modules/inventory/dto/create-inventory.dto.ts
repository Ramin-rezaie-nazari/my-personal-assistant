import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  foodId: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  dailyConsumption?: number;

  @IsOptional()
  @IsNumber()
  safetyStock?: number;

  @IsOptional()
  @IsBoolean()
  essential?: boolean;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
