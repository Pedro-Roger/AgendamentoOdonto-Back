import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { APPOINTMENTS_REPOSITORY } from './repositories/appointments.repository.interface';
import { PatientAppointmentsModule } from '../patient-appointments/patient-appointments.module';

@Module({
  imports: [PatientAppointmentsModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    PrismaService,
    { provide: APPOINTMENTS_REPOSITORY, useClass: AppointmentsRepository },
  ],
  exports: [APPOINTMENTS_REPOSITORY],
})
export class AppointmentsModule {}
