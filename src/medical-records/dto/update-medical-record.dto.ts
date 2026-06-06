import { IsObject, IsOptional } from 'class-validator';

export class UpdateMedicalRecordDto {
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}
