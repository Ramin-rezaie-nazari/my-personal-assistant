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

export class UpdateShoppingItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  @Max(1_000_000_000)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  unit?: string;

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
