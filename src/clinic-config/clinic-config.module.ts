import { Module } from '@nestjs/common';
import { ClinicConfigController } from './clinic-config.controller';
import { ClinicConfigService } from './clinic-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { ServicesRepository } from './repositories/services.repository';
import { SERVICES_REPOSITORY } from './repositories/services.repository.interface';
import { SchedulesRepository } from './repositories/schedules.repository';
import { SCHEDULES_REPOSITORY } from './repositories/schedules.repository.interface';
import { FormSettingsRepository } from './repositories/form-settings.repository';
import { FORM_SETTINGS_REPOSITORY } from './repositories/form-settings.repository.interface';

@Module({
  controllers: [ClinicConfigController],
  providers: [
    ClinicConfigService,
    PrismaService,
    { provide: SERVICES_REPOSITORY, useClass: ServicesRepository },
    { provide: SCHEDULES_REPOSITORY, useClass: SchedulesRepository },
    { provide: FORM_SETTINGS_REPOSITORY, useClass: FormSettingsRepository },
  ],
  exports: [SERVICES_REPOSITORY, SCHEDULES_REPOSITORY, FORM_SETTINGS_REPOSITORY],
})
export class ClinicConfigModule {}
