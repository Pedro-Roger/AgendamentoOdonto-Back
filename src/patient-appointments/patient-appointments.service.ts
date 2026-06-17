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
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PatientAppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SCHEDULES_REPOSITORY) private readonly schedulesRepository: ISchedulesRepository,
    @Inject(SERVICES_REPOSITORY) private readonly servicesRepository: IServicesRepository,
    @Inject(FORM_SETTINGS_REPOSITORY) private readonly formSettingsRepository: IFormSettingsRepository,
    @Inject(APPOINTMENTS_REPOSITORY) private readonly appointmentsRepository: IAppointmentsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  listActiveServices(tenantId: string) {
    return this.servicesRepository.findActive(tenantId);
  }

  getFormSettings(tenantId: string) {
    return this.formSettingsRepository.findLatest(tenantId);
  }

  async getAvailableSchedules(tenantId: string, serviceId: string, date: string) {
    const weekDay = new Date(`${date}T00:00:00`).getDay();
    const [schedules, appointments] = await Promise.all([
      this.schedulesRepository.findByWeekDay(weekDay, tenantId),
      this.appointmentsRepository.findByServiceAndDate(serviceId, date, tenantId),
    ]);
    const bookedTimes = new Set(appointments.map((a) => a.time));
    return schedules.filter((s) => !bookedTimes.has(s.startTime));
  }

  async createAppointment(
    tenantId: string,
    payload: CreateAppointmentDto,
    source = 'INTERNAL',
    apiKeyId?: string,
  ) {
    const appointment = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.patient.findUnique({
        where: { cpf_tenantId: { cpf: payload.cpf, tenantId } },
      });
      const patient =
        existing ??
        (await tx.patient.create({
          data: {
            name: payload.name,
            cpf: payload.cpf,
            email: payload.email,
            phone: payload.phone,
            tenantId,
          },
        }));

      return tx.appointment.create({
        data: {
          patientId: patient.id,
          serviceId: payload.serviceId,
          date: payload.date,
          time: payload.time,
          reason: payload.reason ?? '',
          anamnesisAnswers: payload.anamnesisAnswers as unknown as Prisma.InputJsonValue,
          tenantId,
          source,
          apiKeyId,
        },
      });
    });

    this.notificationsService
      .create({
        type: 'NEW_APPOINTMENT',
        title: 'Nova consulta agendada',
        message: `${payload.name} agendou para ${payload.date} às ${payload.time}`,
        data: { appointmentId: appointment.id, patientName: payload.name },
        tenantId,
      })
      .catch(() => {});

    return appointment;
  }
}
