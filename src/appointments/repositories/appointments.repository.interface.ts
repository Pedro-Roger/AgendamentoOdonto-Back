import { Appointment, Prisma } from '@prisma/client';

export const APPOINTMENTS_REPOSITORY = Symbol('APPOINTMENTS_REPOSITORY');

export type AppointmentWithRelations = Appointment & {
  patient: { id: string; name: string; cpf: string; email: string; phone: string };
  service: { id: string; name: string; durationMinutes: number };
};

export interface IAppointmentsRepository {
  findByDateWithRelations(date: string, tenantId: string): Promise<AppointmentWithRelations[]>;
  findByDateRange(from: string, to: string, tenantId: string): Promise<AppointmentWithRelations[]>;
  findByServiceAndDate(serviceId: string, date: string, tenantId: string): Promise<Appointment[]>;
  findByPatient(patientId: string, tenantId: string): Promise<Appointment[]>;
  create(data: Prisma.AppointmentCreateInput, tx?: Prisma.TransactionClient): Promise<Appointment>;
}
