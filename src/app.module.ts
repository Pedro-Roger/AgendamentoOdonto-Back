import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ClinicConfigModule } from './clinic-config/clinic-config.module';
import { PatientAppointmentsModule } from './patient-appointments/patient-appointments.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { SignaturesModule } from './signatures.module';
import { PatientsModule } from './patients/patients.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60_000, limit: 30 },
      { name: 'medium', ttl: 60 * 60_000, limit: 300 },
    ]),
    AuthModule,
    ClinicConfigModule,
    PatientAppointmentsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    SignaturesModule,
    PatientsModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
