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

  createService(data: CreateServiceDto) {
    return this.servicesRepository.create(data);
  }

  listActiveServices() {
    return this.servicesRepository.findActive();
  }

  updateService(id: string, data: UpdateServiceDto) {
    return this.servicesRepository.update(id, data);
  }

  createSchedule(data: CreateScheduleDto) {
    return this.schedulesRepository.create(data);
  }

  listSchedules() {
    return this.schedulesRepository.findAll();
  }

  replaceSchedules(schedules: CreateScheduleDto[]) {
    return this.schedulesRepository.replaceAll(schedules);
  }

  createFormSettings(fields: FormFieldDto[]) {
    return this.formSettingsRepository.create(fields);
  }

  getFormSettings() {
    return this.formSettingsRepository.findLatest();
  }
}
