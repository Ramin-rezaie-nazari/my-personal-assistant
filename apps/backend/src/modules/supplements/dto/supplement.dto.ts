export class CreateSupplementDto {
  name!: string;
  dosage?: string;
  frequency?: string;
  scheduledTime?: string;
}

export class UpdateSupplementDto {
  name?: string;
  dosage?: string;
  frequency?: string;
  scheduledTime?: string;
  active?: boolean;
}
