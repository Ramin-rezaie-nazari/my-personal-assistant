import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { MemoryType } from '../models/memory.model';

export class RememberMemoryDto {
  @IsEnum(MemoryType)
  type!: MemoryType;

  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsObject()
  value!: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  importance?: number;
}
