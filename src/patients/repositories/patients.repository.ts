import { Injectable } from '@nestjs/common';
import { Patient, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IPatientsRepository } from './patients.repository.interface';

@Injectable()
export class PatientsRepository implements IPatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(q?: string): Promise<Patient[]> {
    if (!q) return this.prisma.patient.findMany();
    return this.prisma.patient.findMany({
      where: { OR: [{ name: { contains: q } }, { cpf: { contains: q } }] },
    });
  }

  findById(id: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({ where: { id } });
  }

  findByCpf(cpf: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({ where: { cpf } });
  }

  create(data: Prisma.PatientCreateInput): Promise<Patient> {
    return this.prisma.patient.create({ data });
  }
}
