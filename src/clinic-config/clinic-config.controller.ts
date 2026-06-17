import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtPayload } from '../common/auth/jwt-payload.type';
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
  createService(@CurrentUser() user: JwtPayload, @Body() body: CreateServiceDto) {
    return this.clinicConfigService.createService(body, user.tenantId);
  }

  @Get('services')
  @Roles('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA')
  listServices(@CurrentUser() user: JwtPayload) {
    return this.clinicConfigService.listActiveServices(user.tenantId);
  }

  @Put('services/:id')
  @Roles('MASTER', 'ADMIN')
  updateService(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateServiceDto,
  ) {
    return this.clinicConfigService.updateService(id, body, user.tenantId);
  }

  @Post('schedules')
  @Roles('MASTER', 'ADMIN')
  createSchedule(@CurrentUser() user: JwtPayload, @Body() body: CreateScheduleDto) {
    return this.clinicConfigService.createSchedule(body, user.tenantId);
  }

  @Get('schedules')
  @Roles('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA')
  listSchedules(@CurrentUser() user: JwtPayload) {
    return this.clinicConfigService.listSchedules(user.tenantId);
  }

  @Post('form-settings')
  @Roles('MASTER', 'ADMIN')
  createFormSettings(@CurrentUser() user: JwtPayload, @Body() body: CreateFormSettingsDto) {
    return this.clinicConfigService.createFormSettings(body.fields, user.tenantId);
  }

  @Get('form-settings')
  @Roles('MASTER', 'ADMIN', 'DENTISTA')
  getFormSettings(@CurrentUser() user: JwtPayload) {
    return this.clinicConfigService.getFormSettings(user.tenantId);
  }

  @Put('schedules')
  @Roles('MASTER', 'ADMIN')
  replaceSchedules(@CurrentUser() user: JwtPayload, @Body() body: CreateScheduleDto[]) {
    return this.clinicConfigService.replaceSchedules(body, user.tenantId);
  }
}
