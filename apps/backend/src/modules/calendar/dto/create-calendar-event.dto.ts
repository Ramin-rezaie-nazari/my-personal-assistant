import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString() @MaxLength(200) title!: string;
  @IsString() @MaxLength(50) type!: string;
  @IsISO8601() startsAt!: string;
  @IsOptional() @IsISO8601() endsAt?: string;
}
