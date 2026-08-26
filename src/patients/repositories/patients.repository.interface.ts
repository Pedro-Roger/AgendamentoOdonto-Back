import { Patient, Prisma } from '@prisma/client';

export const PATIENTS_REPOSITORY = Symbol('PATIENTS_REPOSITORY');

export interface IPatientsRepository {
  findAll(tenantId: string, q?: string): Promise<Patient[]>;
  findById(id: string, tenantId: string): Promise<Patient | null>;
  findByCpfAndTenant(cpf: string, tenantId: string): Promise<Patient | null>;
  create(data: Prisma.PatientCreateInput): Promise<Patient>;
  deleteById(id: string, tenantId: string): Promise<Patient | null>;
}
