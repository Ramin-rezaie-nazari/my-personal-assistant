import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductCandidateDto {
  @IsString() @MaxLength(200) productKey!: string;
  @IsString() @MaxLength(300) title!: string;
  @IsOptional() @IsString() @MaxLength(160) brand?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1000000) quantityValue?: number;
  @IsOptional() @IsString() @MaxLength(32) quantityUnit?: string;
  @IsOptional() @IsObject() identifiers?: Record<string, string | undefined>;
}

export class MatchProductDto {
  @ValidateNested() @Type(() => ProductCandidateDto)
  reference!: ProductCandidateDto;

  @IsArray() @ArrayMaxSize(500)
  @ValidateNested({ each: true }) @Type(() => ProductCandidateDto)
  candidates!: ProductCandidateDto[];
}

export class NightlyRunDto {
  @IsArray() @ArrayMaxSize(500) @IsString({ each: true })
  productKeys!: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true })
  sourceIds?: string[];

  @IsOptional() @IsISO8601() scheduledFor?: string;
  @IsOptional() @IsString() @MaxLength(3) countryCode?: string;
}

export class NightlyPreviewDto {
  @IsOptional() @IsISO8601() now?: string;
  @IsOptional() @IsISO8601() lastSuccessfulRunAt?: string;
}
