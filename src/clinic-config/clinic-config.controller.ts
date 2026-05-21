import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { CreateFormSettingsDto } from './dto/create-form-settings.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ClinicConfigService } from './clinic-config.service';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ClinicConfigController {
  constructor(private readonly clinicConfigService: ClinicConfigService) {}

  @Post('services')
  createService(@Body() body: CreateServiceDto) {
    return this.clinicConfigService.createService(body);
  }

  @Get('services')
  listServices() {
    return this.clinicConfigService.listActiveServices();
  }

  @Put('services/:id')
  updateService(@Param('id') id: string, @Body() body: UpdateServiceDto) {
    return this.clinicConfigService.updateService(id, body);
  }

  @Post('schedules')
  createSchedule(@Body() body: CreateScheduleDto) {
    return this.clinicConfigService.createSchedule(body);
  }

  @Get('schedules')
  listSchedules() {
    return this.clinicConfigService.listSchedules();
  }

  @Post('form-settings')
  createFormSettings(@Body() body: CreateFormSettingsDto) {
    return this.clinicConfigService.createFormSettings(body.fields);
  }
}
