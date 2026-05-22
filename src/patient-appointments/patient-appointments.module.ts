import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PatientAppointmentsController } from './patient-appointments.controller';
import { PatientAppointmentsService } from './patient-appointments.service';
import { SchedulesRepository } from '../clinic-config/repositories/schedules.repository';
import { SCHEDULES_REPOSITORY } from '../clinic-config/repositories/schedules.repository.interface';
import { ServicesRepository } from '../clinic-config/repositories/services.repository';
import { SERVICES_REPOSITORY } from '../clinic-config/repositories/services.repository.interface';
import { FormSettingsRepository } from '../clinic-config/repositories/form-settings.repository';
import { FORM_SETTINGS_REPOSITORY } from '../clinic-config/repositories/form-settings.repository.interface';
import { AppointmentsRepository } from '../appointments/repositories/appointments.repository';
import { APPOINTMENTS_REPOSITORY } from '../appointments/repositories/appointments.repository.interface';

@Module({
  controllers: [PatientAppointmentsController],
  providers: [
    PatientAppointmentsService,
    PrismaService,
    { provide: SCHEDULES_REPOSITORY, useClass: SchedulesRepository },
    { provide: SERVICES_REPOSITORY, useClass: ServicesRepository },
    { provide: FORM_SETTINGS_REPOSITORY, useClass: FormSettingsRepository },
    { provide: APPOINTMENTS_REPOSITORY, useClass: AppointmentsRepository },
  ],
})
export class PatientAppointmentsModule {}
