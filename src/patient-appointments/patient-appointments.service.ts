import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import {
  ISchedulesRepository,
  SCHEDULES_REPOSITORY,
} from '../clinic-config/repositories/schedules.repository.interface';
import {
  IServicesRepository,
  SERVICES_REPOSITORY,
} from '../clinic-config/repositories/services.repository.interface';
import {
  FORM_SETTINGS_REPOSITORY,
  IFormSettingsRepository,
} from '../clinic-config/repositories/form-settings.repository.interface';
import {
  APPOINTMENTS_REPOSITORY,
  IAppointmentsRepository,
} from '../appointments/repositories/appointments.repository.interface';

@Injectable()
export class PatientAppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SCHEDULES_REPOSITORY) private readonly schedulesRepository: ISchedulesRepository,
    @Inject(SERVICES_REPOSITORY) private readonly servicesRepository: IServicesRepository,
    @Inject(FORM_SETTINGS_REPOSITORY) private readonly formSettingsRepository: IFormSettingsRepository,
    @Inject(APPOINTMENTS_REPOSITORY) private readonly appointmentsRepository: IAppointmentsRepository,
  ) {}

  listActiveServices() {
    return this.servicesRepository.findActive();
  }

  getFormSettings() {
    return this.formSettingsRepository.findLatest();
  }

  async getAvailableSchedules(serviceId: string, date: string) {
    const weekDay = new Date(`${date}T00:00:00`).getDay();
    const [schedules, appointments] = await Promise.all([
      this.schedulesRepository.findByWeekDay(weekDay),
      this.appointmentsRepository.findByServiceAndDate(serviceId, date),
    ]);
    const bookedTimes = new Set(appointments.map((a) => a.time));
    return schedules.filter((s) => !bookedTimes.has(s.startTime));
  }

  async createAppointment(payload: CreateAppointmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.patient.findUnique({ where: { cpf: payload.cpf } });
      const patient =
        existing ??
        (await tx.patient.create({
          data: {
            name: payload.name,
            cpf: payload.cpf,
            email: payload.email,
            phone: payload.phone,
          },
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
