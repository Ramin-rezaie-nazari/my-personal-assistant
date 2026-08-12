export class CreateCalendarEventDto {
  title!: string;
  type!: string;
  startsAt!: string;
  endsAt?: string;
}
