import { Injectable, NotFoundException } from '@nestjs/common';
import { MedicalRecord, MedicalRecordAttachment, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IMedicalRecordsRepository } from './medical-records.repository.interface';

@Injectable()
export class MedicalRecordsRepository implements IMedicalRecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { patientId: string; appointmentId?: string; content: Prisma.InputJsonValue; version: number }): Promise<MedicalRecord> {
    return this.prisma.medicalRecord.create({ data });
  }

  async update(id: string, data: { content: Prisma.InputJsonValue }, tenantId: string): Promise<MedicalRecord> {
    const result = await this.prisma.medicalRecord.updateMany({
      where: { id, patient: { tenantId } },
      data,
    });
    if (result.count === 0) {
      throw new NotFoundException('Prontuário não encontrado');
    }
    return this.prisma.medicalRecord.findFirstOrThrow({
      where: { id, patient: { tenantId } },
    });
  }

  findById(id: string, tenantId: string): Promise<MedicalRecord | null> {
    return this.prisma.medicalRecord.findFirst({ where: { id, patient: { tenantId } } });
  }

  findByPatient(patientId: string, tenantId: string): Promise<MedicalRecord[]> {
    return this.prisma.medicalRecord.findMany({
      where: { patientId, patient: { tenantId } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findLatestByPatient(patientId: string, tenantId: string): Promise<MedicalRecord | null> {
    return this.prisma.medicalRecord.findFirst({
      where: { patientId, patient: { tenantId } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async patientBelongsToTenant(patientId: string, tenantId: string): Promise<boolean> {
    return (
      (await this.prisma.patient.findFirst({
        where: { id: patientId, tenantId },
        select: { id: true },
      })) !== null
    );
  }

  createAttachment(data: {
    medicalRecordId: string;
    fileUrl: string;
    category: string;
  }): Promise<MedicalRecordAttachment> {
    return this.prisma.medicalRecordAttachment.create({ data });
  }

  findAttachments(medicalRecordId: string, tenantId: string): Promise<MedicalRecordAttachment[]> {
    return this.prisma.medicalRecordAttachment.findMany({
      where: { medicalRecordId, medicalRecord: { patient: { tenantId } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
