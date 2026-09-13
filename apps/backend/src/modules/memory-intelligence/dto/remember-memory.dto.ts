import { IsDefined, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { MemoryType } from '../models/memory.model';

export class RememberMemoryDto {
  @IsEnum(MemoryType)
  type!: MemoryType;

  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsDefined()
  value!: unknown;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  importance?: number;
}
