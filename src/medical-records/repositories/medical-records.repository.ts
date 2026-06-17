import { Injectable } from '@nestjs/common';
import { MedicalRecord, MedicalRecordAttachment, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IMedicalRecordsRepository } from './medical-records.repository.interface';

@Injectable()
export class MedicalRecordsRepository implements IMedicalRecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { patientId: string; appointmentId?: string; content: Prisma.InputJsonValue; version: number }): Promise<MedicalRecord> {
    return this.prisma.medicalRecord.create({ data });
  }

  update(id: string, data: { content: Prisma.InputJsonValue }): Promise<MedicalRecord> {
    return this.prisma.medicalRecord.update({ where: { id }, data });
  }

  findById(id: string): Promise<MedicalRecord | null> {
    return this.prisma.medicalRecord.findUnique({ where: { id } });
  }

  findByPatient(patientId: string, tenantId: string): Promise<MedicalRecord[]> {
    return this.prisma.medicalRecord.findMany({
      where: { patientId, patient: { tenantId } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findLatestByPatient(patientId: string): Promise<MedicalRecord | null> {
    return this.prisma.medicalRecord.findFirst({
      where: { patientId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  createAttachment(data: {
    medicalRecordId: string;
    fileUrl: string;
    category: string;
  }): Promise<MedicalRecordAttachment> {
    return this.prisma.medicalRecordAttachment.create({ data });
  }

  findAttachments(medicalRecordId: string): Promise<MedicalRecordAttachment[]> {
    return this.prisma.medicalRecordAttachment.findMany({
      where: { medicalRecordId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
