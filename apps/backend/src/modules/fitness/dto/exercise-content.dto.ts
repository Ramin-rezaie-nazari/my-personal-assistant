import { IsArray, IsBoolean, IsIn, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'professional'] as const;
const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const;
const MEDIA_KINDS = ['video', 'image', 'animation'] as const;
const MEDIA_STATUSES = ['pending', 'approved', 'rejected', 'retired'] as const;
const RELATIONSHIP_KINDS = ['alternative', 'progression', 'regression'] as const;

export class ExerciseQueryDto {
  @IsOptional() @IsString() @MaxLength(120) search?: string;
  @IsOptional() @IsString() @MaxLength(60) discipline?: string;
  @IsOptional() @IsString() @MaxLength(80) muscle?: string;
  @IsOptional() @IsString() @MaxLength(80) equipment?: string;
  @IsOptional() @IsIn(DIFFICULTIES) difficulty?: (typeof DIFFICULTIES)[number];
  @IsOptional() @IsString() @MaxLength(80) goal?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsInt() @Min(0) offset?: number;
}

export class CreateExerciseDto {
  @IsString() @IsNotEmpty() @MaxLength(160) slug!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(160) nameFa?: string;
  @IsOptional() @IsArray() aliases?: string[];
  @IsString() @IsNotEmpty() @MaxLength(60) discipline!: string;
  @IsOptional() @IsString() @MaxLength(80) movementPattern?: string;
  @IsArray() primaryMuscles!: string[];
  @IsOptional() @IsArray() secondaryMuscles?: string[];
  @IsArray() equipment!: string[];
  @IsIn(DIFFICULTIES) difficulty!: (typeof DIFFICULTIES)[number];
  @IsArray() goals!: string[];
  @IsOptional() @IsString() @MaxLength(5000) instructions?: string;
  @IsOptional() @IsArray() coachCues?: string[];
  @IsOptional() @IsArray() commonMistakes?: string[];
  @IsOptional() @IsArray() cautions?: string[];
  @IsOptional() @IsIn(CONTENT_STATUSES) contentStatus?: (typeof CONTENT_STATUSES)[number];
}

export class AddExerciseMediaDto {
  @IsIn(MEDIA_KINDS) kind!: (typeof MEDIA_KINDS)[number];
  @IsUrl({ require_tld: false }) url!: string;
  @IsOptional() @IsUrl({ require_tld: false }) sourceUrl?: string;
  @IsString() @IsNotEmpty() @MaxLength(160) sourceProvider!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) license!: string;
  @IsOptional() @IsString() @MaxLength(500) attribution?: string;
  @IsOptional() @IsString() @MaxLength(80) mimeType?: string;
  @IsOptional() @IsInt() @Min(0) @Max(86400) durationSeconds?: number;
  @IsOptional() @IsInt() @Min(1) @Max(10000) width?: number;
  @IsOptional() @IsInt() @Min(1) @Max(10000) height?: number;
  @IsOptional() @IsString() @MaxLength(16) language?: string;
  @IsOptional() @IsUrl({ require_tld: false }) posterUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) checksum?: string;
  @IsOptional() @IsString() @MaxLength(80) acquisitionMode?: string;
  @IsOptional() @IsString() @MaxLength(1000) sourceReference?: string;
  @IsOptional() @IsString() @MaxLength(160) rightsBasis?: string;
  @IsOptional() @IsString() @MaxLength(160) creator?: string;
  @IsOptional() @IsString() @MaxLength(500) storageKey?: string;
  @IsOptional() @IsBoolean() transformed?: boolean;
  @IsOptional() @IsString() @MaxLength(160) reviewer?: string;
  @IsOptional() @IsISO8601() reviewedAt?: string;
  @IsOptional() @IsString() @MaxLength(80) contentVersion?: string;
  @IsOptional() @IsIn(MEDIA_STATUSES) status?: (typeof MEDIA_STATUSES)[number];
  @IsOptional() @IsInt() @Min(0) @Max(1000) position?: number;
}

export class AddExerciseRelationshipDto {
  @IsString() @IsNotEmpty() @MaxLength(80) toExerciseId!: string;
  @IsIn(RELATIONSHIP_KINDS) kind!: (typeof RELATIONSHIP_KINDS)[number];
  @IsOptional() @IsInt() @Min(0) @Max(1000) priority?: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
