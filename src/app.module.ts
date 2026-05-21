import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ClinicConfigModule } from './clinic-config/clinic-config.module';
import { PatientAppointmentsModule } from './patient-appointments/patient-appointments.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { SignaturesModule } from './signatures.module';
import { PatientsModule } from './patients/patients.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, ClinicConfigModule, PatientAppointmentsModule, MedicalRecordsModule, SignaturesModule, PatientsModule, UsersModule],
})
export class AppModule {}
