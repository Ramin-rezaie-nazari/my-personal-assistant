export class CreateCalendarEventDto {
  title!: string;
  type!: string;
  startsAt!: Date;
  endsAt?: Date;
}
