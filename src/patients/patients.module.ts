import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PrismaService } from '../prisma/prisma.service';
import { PatientsRepository } from './repositories/patients.repository';
import { PATIENTS_REPOSITORY } from './repositories/patients.repository.interface';
import { AppointmentsRepository } from '../appointments/repositories/appointments.repository';
import { APPOINTMENTS_REPOSITORY } from '../appointments/repositories/appointments.repository.interface';
import { MedicalRecordsRepository } from '../medical-records/repositories/medical-records.repository';
import { MEDICAL_RECORDS_REPOSITORY } from '../medical-records/repositories/medical-records.repository.interface';

@Module({
  controllers: [PatientsController],
  providers: [
    PatientsService,
    PrismaService,
    { provide: PATIENTS_REPOSITORY, useClass: PatientsRepository },
    { provide: APPOINTMENTS_REPOSITORY, useClass: AppointmentsRepository },
    { provide: MEDICAL_RECORDS_REPOSITORY, useClass: MedicalRecordsRepository },
  ],
  exports: [PATIENTS_REPOSITORY],
})
export class PatientsModule {}
