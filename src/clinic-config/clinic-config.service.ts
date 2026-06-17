import { Inject, Injectable } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FormFieldDto } from './dto/create-form-settings.dto';
import {
  IServicesRepository,
  SERVICES_REPOSITORY,
} from './repositories/services.repository.interface';
import {
  ISchedulesRepository,
  SCHEDULES_REPOSITORY,
} from './repositories/schedules.repository.interface';
import {
  FORM_SETTINGS_REPOSITORY,
  IFormSettingsRepository,
} from './repositories/form-settings.repository.interface';

@Injectable()
export class ClinicConfigService {
  constructor(
    @Inject(SERVICES_REPOSITORY) private readonly servicesRepository: IServicesRepository,
    @Inject(SCHEDULES_REPOSITORY) private readonly schedulesRepository: ISchedulesRepository,
    @Inject(FORM_SETTINGS_REPOSITORY) private readonly formSettingsRepository: IFormSettingsRepository,
  ) {}

  createService(data: CreateServiceDto, tenantId: string) {
    return this.servicesRepository.create(data, tenantId);
  }

  listActiveServices(tenantId: string) {
    return this.servicesRepository.findActive(tenantId);
  }

  updateService(id: string, data: UpdateServiceDto, tenantId: string) {
    return this.servicesRepository.update(id, data, tenantId);
  }

  createSchedule(data: CreateScheduleDto, tenantId: string) {
    return this.schedulesRepository.create(data, tenantId);
  }

  listSchedules(tenantId: string) {
    return this.schedulesRepository.findAll(tenantId);
  }

  replaceSchedules(schedules: CreateScheduleDto[], tenantId: string) {
    return this.schedulesRepository.replaceAll(schedules, tenantId);
  }

  createFormSettings(fields: FormFieldDto[], tenantId: string) {
    return this.formSettingsRepository.create(fields, tenantId);
  }

  getFormSettings(tenantId: string) {
    return this.formSettingsRepository.findLatest(tenantId);
  }
}
