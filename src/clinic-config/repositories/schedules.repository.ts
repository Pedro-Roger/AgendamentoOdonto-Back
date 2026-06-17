import { Injectable } from '@nestjs/common';
import { Schedule } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { ISchedulesRepository } from './schedules.repository.interface';

@Injectable()
export class SchedulesRepository implements ISchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateScheduleDto, tenantId: string): Promise<Schedule> {
    return this.prisma.schedule.create({ data: { ...data, tenantId } });
  }

  findAll(tenantId: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({ where: { tenantId }, orderBy: { weekDay: 'asc' } });
  }

  findByWeekDay(weekDay: number, tenantId: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({ where: { weekDay, tenantId } });
  }

  async replaceAll(schedules: CreateScheduleDto[], tenantId: string): Promise<Schedule[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.schedule.deleteMany({ where: { tenantId } });
      if (schedules.length === 0) return [];
      await tx.schedule.createMany({ data: schedules.map((s) => ({ ...s, tenantId })) });
      return tx.schedule.findMany({ where: { tenantId }, orderBy: { weekDay: 'asc' } });
    });
  }
}
