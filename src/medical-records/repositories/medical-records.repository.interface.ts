import { MedicalRecord, MedicalRecordAttachment, Prisma } from '@prisma/client';

export const MEDICAL_RECORDS_REPOSITORY = Symbol('MEDICAL_RECORDS_REPOSITORY');

export interface IMedicalRecordsRepository {
  create(data: {
    appointmentId: string;
    content: Prisma.InputJsonValue;
    version: number;
  }): Promise<MedicalRecord>;
  findById(id: string): Promise<MedicalRecord | null>;
  findByPatient(patientId: string): Promise<MedicalRecord[]>;
  createAttachment(data: {
    medicalRecordId: string;
    fileUrl: string;
    category: string;
  }): Promise<MedicalRecordAttachment>;
}
