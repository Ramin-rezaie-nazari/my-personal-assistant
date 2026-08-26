import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateShoppingItemDto {
  @IsUUID()
  foodId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsNumber()
  @Min(0.000001)
  @Max(1_000_000_000)
  quantity!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  unit!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @IsOptional()
  @IsUUID()
  sourceRecipeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  priority?: string;
}
