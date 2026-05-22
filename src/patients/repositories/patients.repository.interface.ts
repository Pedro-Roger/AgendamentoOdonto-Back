import { Patient, Prisma } from '@prisma/client';

export const PATIENTS_REPOSITORY = Symbol('PATIENTS_REPOSITORY');

export interface IPatientsRepository {
  findAll(q?: string): Promise<Patient[]>;
  findById(id: string): Promise<Patient | null>;
  findByCpf(cpf: string): Promise<Patient | null>;
  create(data: Prisma.PatientCreateInput): Promise<Patient>;
}
