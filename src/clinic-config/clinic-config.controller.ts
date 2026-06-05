import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { CreateFormSettingsDto } from './dto/create-form-settings.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ClinicConfigService } from './clinic-config.service';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicConfigController {
  constructor(private readonly clinicConfigService: ClinicConfigService) {}

  @Post('services')
  @Roles('MASTER', 'ADMIN')
  createService(@Body() body: CreateServiceDto) {
    return this.clinicConfigService.createService(body);
  }

  @Get('services')
  @Roles('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA')
  listServices() {
    return this.clinicConfigService.listActiveServices();
  }

  @Put('services/:id')
  @Roles('MASTER', 'ADMIN')
  updateService(@Param('id') id: string, @Body() body: UpdateServiceDto) {
    return this.clinicConfigService.updateService(id, body);
  }

  @Post('schedules')
  @Roles('MASTER', 'ADMIN')
  createSchedule(@Body() body: CreateScheduleDto) {
    return this.clinicConfigService.createSchedule(body);
  }

  @Get('schedules')
  @Roles('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA')
  listSchedules() {
    return this.clinicConfigService.listSchedules();
  }

  @Post('form-settings')
  @Roles('MASTER', 'ADMIN')
  createFormSettings(@Body() body: CreateFormSettingsDto) {
    return this.clinicConfigService.createFormSettings(body.fields);
  }

  @Get('form-settings')
  @Roles('MASTER', 'ADMIN', 'DENTISTA')
  getFormSettings() {
    return this.clinicConfigService.getFormSettings();
  }

  @Put('schedules')
  @Roles('MASTER', 'ADMIN')
  replaceSchedules(@Body() body: CreateScheduleDto[]) {
    return this.clinicConfigService.replaceSchedules(body);
  }
}
