import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { ClinicConfigModule } from './clinic-config/clinic-config.module';
import { PatientAppointmentsModule } from './patient-appointments/patient-appointments.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { SignaturesModule } from './signatures.module';
import { PatientsModule } from './patients/patients.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { DiscordModule } from './common/discord/discord.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60_000, limit: 30 },
      { name: 'medium', ttl: 60 * 60_000, limit: 300 },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
    ClinicConfigModule,
    PatientAppointmentsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    SignaturesModule,
    PatientsModule,
    UsersModule,
    TenantsModule,
    NotificationsModule,
    WhatsAppModule,
    DiscordModule,
    ApiKeysModule,
    IntegrationsModule,
    DashboardModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
