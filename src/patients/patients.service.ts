import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IPatientsRepository,
  PATIENTS_REPOSITORY,
} from './repositories/patients.repository.interface';
import {
  APPOINTMENTS_REPOSITORY,
  IAppointmentsRepository,
} from '../appointments/repositories/appointments.repository.interface';
import {
  IMedicalRecordsRepository,
  MEDICAL_RECORDS_REPOSITORY,
} from '../medical-records/repositories/medical-records.repository.interface';
import { TimelineEventType } from '../common/enums/timeline-event-type.enum';

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  title: string;
  date: string;
  status?: string;
};

@Injectable()
export class PatientsService {
  constructor(
    @Inject(PATIENTS_REPOSITORY) private readonly patientsRepository: IPatientsRepository,
    @Inject(APPOINTMENTS_REPOSITORY) private readonly appointmentsRepository: IAppointmentsRepository,
    @Inject(MEDICAL_RECORDS_REPOSITORY) private readonly medicalRecordsRepository: IMedicalRecordsRepository,
  ) {}

  list(tenantId: string, q?: string) {
    return this.patientsRepository.findAll(tenantId, q);
  }

  async profile(id: string, tenantId: string) {
    const patient = await this.patientsRepository.findById(id, tenantId);
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    return patient;
  }

  async timeline(id: string, tenantId: string): Promise<TimelineEvent[]> {
    const [appointments, medicalRecords] = await Promise.all([
      this.appointmentsRepository.findByPatient(id, tenantId),
      this.medicalRecordsRepository.findByPatient(id, tenantId),
    ]);

    const appointmentEvents: TimelineEvent[] = appointments.map((a) => ({
      id: a.id,
      type: TimelineEventType.APPOINTMENT,
      title: `Consulta ${a.time ?? ''}`,
      date: a.date ?? '',
    }));

    const recordEvents: TimelineEvent[] = medicalRecords.map((r) => ({
      id: r.id,
      type: TimelineEventType.MEDICAL_RECORD,
      title: 'Prontuário',
      date: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
    }));

    return [...appointmentEvents, ...recordEvents].sort((a, b) =>
      (b.date ?? '').localeCompare(a.date ?? ''),
    );
  }
}
