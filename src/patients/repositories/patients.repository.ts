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
}
