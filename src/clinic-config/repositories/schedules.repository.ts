import { Injectable } from '@nestjs/common';
import { Schedule } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { ISchedulesRepository } from './schedules.repository.interface';

@Injectable()
export class SchedulesRepository implements ISchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateScheduleDto): Promise<Schedule> {
    return this.prisma.schedule.create({ data });
  }

  findAll(): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({ orderBy: { weekDay: 'asc' } });
  }

  findByWeekDay(weekDay: number): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({ where: { weekDay } });
  }

  async replaceAll(schedules: CreateScheduleDto[]): Promise<Schedule[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.schedule.deleteMany({});
      if (schedules.length === 0) return [];
      await tx.schedule.createMany({ data: schedules });
      return tx.schedule.findMany({ orderBy: { weekDay: 'asc' } });
    });
  }
}
