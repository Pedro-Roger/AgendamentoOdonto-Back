import { Injectable } from '@nestjs/common';
import { Patient, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IPatientsRepository } from './patients.repository.interface';

@Injectable()
export class PatientsRepository implements IPatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, q?: string): Promise<Patient[]> {
    const where: Prisma.PatientWhereInput = { tenantId };
    if (q) where.OR = [{ name: { contains: q } }, { cpf: { contains: q } }];
    return this.prisma.patient.findMany({ where });
  }

  findById(id: string, tenantId: string): Promise<Patient | null> {
    return this.prisma.patient.findFirst({ where: { id, tenantId } });
  }

  findByCpfAndTenant(cpf: string, tenantId: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({ where: { cpf_tenantId: { cpf, tenantId } } });
  }

  create(data: Prisma.PatientCreateInput): Promise<Patient> {
    return this.prisma.patient.create({ data });
  }

  async deleteById(id: string, tenantId: string): Promise<Patient | null> {
    return this.prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findFirst({ where: { id, tenantId } });
      if (!patient) return null;

      const appointments = await tx.appointment.findMany({
        where: { patientId: id, tenantId },
        select: { id: true },
      });
      const appointmentIds = appointments.map((appointment) => appointment.id);

      const records = await tx.medicalRecord.findMany({
        where: { patientId: id },
        select: { id: true },
      });
      const recordIds = records.map((record) => record.id);

      if (appointmentIds.length > 0) {
        await tx.appointmentReminder.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
      }
      if (recordIds.length > 0) {
        await tx.signatureToken.deleteMany({ where: { medicalRecordId: { in: recordIds } } });
        await tx.medicalRecordAttachment.deleteMany({ where: { medicalRecordId: { in: recordIds } } });
      }

      await tx.medicalRecord.deleteMany({ where: { patientId: id } });
      await tx.appointment.deleteMany({ where: { patientId: id, tenantId } });
      await tx.patient.delete({ where: { id } });

      return patient;
    });
  }
}
