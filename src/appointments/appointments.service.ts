import { Inject, Injectable } from '@nestjs/common';
import {
  APPOINTMENTS_REPOSITORY,
  IAppointmentsRepository,
} from './repositories/appointments.repository.interface';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(APPOINTMENTS_REPOSITORY)
    private readonly appointmentsRepository: IAppointmentsRepository,
  ) {}

  async listByDate(date: string) {
    const appointments = await this.appointmentsRepository.findByDateWithRelations(date);
    return appointments.map((a) => ({
      id: a.id,
      date: a.date,
      time: a.time,
      patient: a.patient,
      service: a.service,
    }));
  }
}
