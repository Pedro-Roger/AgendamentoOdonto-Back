import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormSettingsDto } from './dto/create-form-settings.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ClinicConfigService {
  constructor(private readonly prisma: PrismaService) {}

  createService(data: CreateServiceDto) {
    return this.prisma.service.create({ data });
  }

  listActiveServices() {
    return this.prisma.service.findMany({ where: { isActive: true } });
  }

  updateService(id: string, data: UpdateServiceDto) {
    return this.prisma.service.update({ where: { id }, data });
  }

  createSchedule(data: CreateScheduleDto) {
    return this.prisma.schedule.create({ data });
  }

  listSchedules() {
    return this.prisma.schedule.findMany({ orderBy: { weekDay: 'asc' } });
  }

  createFormSettings(fields: CreateFormSettingsDto['fields']) {
    return this.prisma.formSetting.create({ data: { fields: fields as unknown as Prisma.InputJsonValue } });
  }
}
