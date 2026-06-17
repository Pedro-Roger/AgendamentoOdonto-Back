import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPOINTMENTS_REPOSITORY,
  IAppointmentsRepository,
} from './repositories/appointments.repository.interface';
import { PatientAppointmentsService } from '../patient-appointments/patient-appointments.service';
import { CreateAppointmentDto } from '../patient-appointments/dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(APPOINTMENTS_REPOSITORY)
    private readonly appointmentsRepository: IAppointmentsRepository,
    private readonly patientAppointmentsService: PatientAppointmentsService,
  ) {}

  createInternal(tenantId: string, payload: CreateAppointmentDto) {
    return this.patientAppointmentsService.createAppointment(tenantId, payload, 'INTERNAL');
  }

  availability(tenantId: string, serviceId: string, date: string) {
    return this.patientAppointmentsService.getAvailableSchedules(tenantId, serviceId, date);
  }

  async findByDateRange(from: string, to: string, tenantId: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('Datas inválidas');
    }
    if (toDate < fromDate) {
      throw new BadRequestException('Data final deve ser maior ou igual à data inicial');
    }
    const diffMs = toDate.getTime() - fromDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 31) {
      throw new BadRequestException('Intervalo máximo de 31 dias');
    }
    return this.appointmentsRepository.findByDateRange(from, to, tenantId);
  }

  async listByDate(date: string, tenantId: string) {
    const appointments = await this.appointmentsRepository.findByDateWithRelations(date, tenantId);
    return appointments.map((a) => ({
      id: a.id,
      date: a.date,
      time: a.time,
      patient: a.patient,
      service: a.service,
    }));
  }
}
