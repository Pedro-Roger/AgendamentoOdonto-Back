import { Schedule } from '@prisma/client';
import { CreateScheduleDto } from '../dto/create-schedule.dto';

export const SCHEDULES_REPOSITORY = Symbol('SCHEDULES_REPOSITORY');

export interface ISchedulesRepository {
  create(data: CreateScheduleDto): Promise<Schedule>;
  findAll(): Promise<Schedule[]>;
  findByWeekDay(weekDay: number): Promise<Schedule[]>;
  replaceAll(schedules: CreateScheduleDto[]): Promise<Schedule[]>;
}
