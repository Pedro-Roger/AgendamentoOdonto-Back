import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PatientAppointmentsController } from './patient-appointments.controller';
import { PatientAppointmentsService } from './patient-appointments.service';

@Module({
  controllers: [PatientAppointmentsController],
  providers: [PatientAppointmentsService, PrismaService],
})
export class PatientAppointmentsModule {}
