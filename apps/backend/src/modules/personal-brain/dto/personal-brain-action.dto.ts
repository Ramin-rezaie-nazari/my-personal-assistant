import { IsArray, IsEnum, IsISO8601, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { DecisionCandidate } from '../services/unified-decision-engine.service';
import type { NotificationPreferences } from '../services/notification-orchestrator.service';
import type { NotificationAction } from '../services/notification-feedback.service';
import type { NotificationPlatform } from '../services/notification-device-registry.service';
import type { SupportedLanguage } from '../services/coach-message.service';
import type { ProactiveEvent } from '../services/proactive-event-engine.service';

export class DecisionOutcomeDto {
  @IsString() @IsNotEmpty() decisionId!: string;
  @IsEnum(['positive', 'neutral', 'negative']) outcome!: 'positive' | 'neutral' | 'negative';
  @IsOptional() @IsNumber() @Min(-1) @Max(1) score?: number;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class DecisionExecuteDto {
  @IsObject() candidate!: DecisionCandidate;
  @IsOptional() @IsObject() context?: Record<string, unknown>;
}

export class DecisionConfirmTokenDto {
  @IsOptional() @IsString() @MaxLength(512) token?: string;
}

export class CoachCueDto {
  @IsEnum(['exerciseStart', 'countdown', 'transition', 'safety', 'explanation']) kind!: 'exerciseStart' | 'countdown' | 'transition' | 'safety' | 'explanation';
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsInt() @Min(0) @Max(60) seconds?: number;
  @IsOptional() @IsString() @MaxLength(1000) message?: string;
  @IsOptional() @IsEnum(['fa', 'en']) language?: SupportedLanguage;
  @IsOptional() @IsInt() @Min(1) @Max(3600) durationSeconds?: number;
}

export class DecisionExplainDto {
  @IsOptional() @IsString() @MaxLength(2000) message?: string;
}

export class FitnessSessionRequestDto {
  @IsOptional() @IsString() @MaxLength(2000) message?: string;
  @IsOptional() @IsInt() @Min(1) @Max(600) durationMin?: number;
  @IsOptional() @IsString() @MaxLength(50) level?: string;
  @IsOptional() @IsString() @MaxLength(50) focus?: string;
}

export class CoachMessageDto {
  @IsOptional() @IsString() @MaxLength(2000) message?: string;
  @IsOptional() @IsEnum(['fa', 'en']) language?: SupportedLanguage;
}

export class FitnessPerformanceDto {
  [key: string]: unknown;
  @IsString() @IsNotEmpty() @MaxLength(100) discipline!: string;
  @IsOptional() @IsString() @MaxLength(200) exerciseId?: string;
  @IsOptional() @IsString() @MaxLength(200) exerciseName?: string;
  @IsOptional() @IsString() @MaxLength(200) sessionId?: string;
  @IsOptional() @IsString() @MaxLength(200) workoutId?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1) formScore?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) completionRate?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(10) perceivedDifficulty?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) recoveryScore?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10000) reps?: number;
  @IsOptional() @IsInt() @Min(0) @Max(1000) sets?: number;
  @IsOptional() @IsInt() @Min(0) @Max(86400) durationSeconds?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(10000) loadKg?: number;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional() @IsISO8601() performedAt?: string;
}

export class NotificationDecisionDto {
  @IsObject() event!: ProactiveEvent;
  @IsOptional() @IsObject() preferences?: NotificationPreferences;
}

export class NotificationFeedbackDto {
  @IsString() @IsNotEmpty() @MaxLength(200) dedupeKey!: string;
  @IsString() @IsNotEmpty() @MaxLength(100) eventType!: string;
  @IsEnum(['delivered', 'opened', 'completed', 'snoozed', 'dismissed', 'ignored']) action!: NotificationAction;
  @IsOptional() @IsISO8601() snoozeUntil?: string;
}

export class NotificationDeviceDto {
  @IsEnum(['ios', 'android', 'web']) platform!: NotificationPlatform;
  @IsString() @IsNotEmpty() @MaxLength(4096) pushToken!: string;
  @IsOptional() @IsEnum(['fa', 'en']) locale?: 'fa' | 'en';
  @IsOptional() @IsString() @MaxLength(100) timezone?: string;
}

export class NotificationDeviceDisableDto {
  @IsString() @IsNotEmpty() @MaxLength(200) deviceId!: string;
}

export class ScenarioCompareDto {
  @IsArray() candidates!: DecisionCandidate[];
  @IsOptional() @IsObject() baseline?: Record<string, number>;
  @IsOptional() @IsObject() context?: {
    budgetPressure?: boolean;
    capacityPressure?: boolean;
    healthConstraint?: boolean;
  };
}
