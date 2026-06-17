import { MedicalRecord, MedicalRecordAttachment, Prisma } from '@prisma/client';

export const MEDICAL_RECORDS_REPOSITORY = Symbol('MEDICAL_RECORDS_REPOSITORY');

export interface IMedicalRecordsRepository {
  create(data: {
    patientId: string;
    appointmentId?: string;
    content: Prisma.InputJsonValue;
    version: number;
  }): Promise<MedicalRecord>;
  update(id: string, data: {
    content: Prisma.InputJsonValue;
  }, tenantId: string): Promise<MedicalRecord>;
  findById(id: string, tenantId: string): Promise<MedicalRecord | null>;
  findByPatient(patientId: string, tenantId: string): Promise<MedicalRecord[]>;
  findLatestByPatient(patientId: string, tenantId: string): Promise<MedicalRecord | null>;
  patientBelongsToTenant(patientId: string, tenantId: string): Promise<boolean>;
  createAttachment(data: {
    medicalRecordId: string;
    fileUrl: string;
    category: string;
  }): Promise<MedicalRecordAttachment>;
  findAttachments(medicalRecordId: string, tenantId: string): Promise<MedicalRecordAttachment[]>;
}
