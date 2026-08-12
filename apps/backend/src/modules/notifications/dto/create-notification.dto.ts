export class CreateNotificationDto {
  title!: string;
  body?: string;
  type!: string;
  scheduledAt?: Date;
}
