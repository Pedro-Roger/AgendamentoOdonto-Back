import { Schedule } from '@prisma/client';
import { CreateScheduleDto } from '../dto/create-schedule.dto';

export const SCHEDULES_REPOSITORY = Symbol('SCHEDULES_REPOSITORY');

export interface ISchedulesRepository {
  create(data: CreateScheduleDto, tenantId: string): Promise<Schedule>;
  findAll(tenantId: string): Promise<Schedule[]>;
  findByWeekDay(weekDay: number, tenantId: string): Promise<Schedule[]>;
  replaceAll(schedules: CreateScheduleDto[], tenantId: string): Promise<Schedule[]>;
}
