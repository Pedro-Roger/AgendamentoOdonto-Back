import { Injectable } from '@nestjs/common';
import { Appointment, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AppointmentWithRelations,
  IAppointmentsRepository,
} from './appointments.repository.interface';

@Injectable()
export class AppointmentsRepository implements IAppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByDateWithRelations(date: string): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({
      where: { date },
      orderBy: { time: 'asc' },
      include: {
        patient: { select: { id: true, name: true, cpf: true, email: true, phone: true } },
        service: { select: { id: true, name: true, durationMinutes: true } },
      },
    }) as unknown as Promise<AppointmentWithRelations[]>;
  }

  findByDateRange(from: string, to: string): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: {
        patient: { select: { id: true, name: true, cpf: true, email: true, phone: true } },
        service: { select: { id: true, name: true, durationMinutes: true } },
      },
    }) as unknown as Promise<AppointmentWithRelations[]>;
  }

  findByServiceAndDate(serviceId: string, date: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({ where: { serviceId, date } });
  }

  findByPatient(patientId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
    });
  }

  create(data: Prisma.AppointmentCreateInput, tx?: Prisma.TransactionClient): Promise<Appointment> {
    const client = tx ?? this.prisma;
    return client.appointment.create({ data });
  }
}
