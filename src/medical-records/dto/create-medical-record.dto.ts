import { IsOptional, IsString } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  content!: Record<string, unknown>;
}
