export class CreateMedicalRecordDto {
  appointmentId!: string;
  content!: Record<string, unknown>;
}
