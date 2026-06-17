import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { ApiKeyGuard } from '../common/auth/api-key.guard';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { PatientAppointmentsModule } from '../patient-appointments/patient-appointments.module';

@Module({
  imports: [ApiKeysModule, PatientAppointmentsModule],
  controllers: [IntegrationsController],
  providers: [ApiKeyGuard],
})
export class IntegrationsModule {}
