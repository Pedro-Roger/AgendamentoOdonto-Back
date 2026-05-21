import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class PatientAppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableSchedules(serviceId: string, date: string) {
    const targetDate = new Date(`${date}T00:00:00`);
    const weekDay = targetDate.getDay();

    const schedules = await this.prisma.schedule.findMany({ where: { weekDay } });
    const appointments = await this.prisma.appointment.findMany({ where: { serviceId, date } });
    const bookedTimes = new Set(appointments.map((appointment) => appointment.time));

    return schedules.filter((schedule) => !bookedTimes.has(schedule.startTime));
  }

  async createAppointment(payload: CreateAppointmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingPatient = await tx.patient.findUnique({ where: { cpf: payload.cpf } });
      const patient =
        existingPatient ??
        (await tx.patient.create({
          data: { name: payload.name, cpf: payload.cpf, email: payload.email, phone: payload.phone },
        }));

      return tx.appointment.create({
        data: {
          patientId: patient.id,
          serviceId: payload.serviceId,
          date: payload.date,
          time: payload.time,
          anamnesisAnswers: payload.anamnesisAnswers as unknown as Prisma.InputJsonValue,
        },
      });
    });
  }
}
