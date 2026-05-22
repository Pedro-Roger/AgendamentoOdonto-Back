import { Injectable } from '@nestjs/common';
import { MedicalRecord, MedicalRecordAttachment, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IMedicalRecordsRepository } from './medical-records.repository.interface';

@Injectable()
export class MedicalRecordsRepository implements IMedicalRecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { appointmentId: string; content: Prisma.InputJsonValue; version: number }): Promise<MedicalRecord> {
    return this.prisma.medicalRecord.create({ data });
  }

  findById(id: string): Promise<MedicalRecord | null> {
    return this.prisma.medicalRecord.findUnique({ where: { id } });
  }

  findByPatient(patientId: string): Promise<MedicalRecord[]> {
    return this.prisma.medicalRecord.findMany({
      where: { appointment: { patientId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createAttachment(data: {
    medicalRecordId: string;
    fileUrl: string;
    category: string;
  }): Promise<MedicalRecordAttachment> {
    return this.prisma.medicalRecordAttachment.create({ data });
  }
}
