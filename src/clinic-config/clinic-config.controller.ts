import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentTenantUser } from '../common/auth/current-user.decorator';
import { TenantJwtPayload } from '../common/auth/jwt-payload.type';
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
  createService(@CurrentTenantUser() user: TenantJwtPayload, @Body() body: CreateServiceDto) {
    return this.clinicConfigService.createService(body, user.tenantId);
  }

  @Get('services')
  @Roles('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA')
  listServices(@CurrentTenantUser() user: TenantJwtPayload) {
    return this.clinicConfigService.listActiveServices(user.tenantId);
  }

  @Put('services/:id')
  @Roles('MASTER', 'ADMIN')
  updateService(
    @CurrentTenantUser() user: TenantJwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateServiceDto,
  ) {
    return this.clinicConfigService.updateService(id, body, user.tenantId);
  }

  @Post('schedules')
  @Roles('MASTER', 'ADMIN')
  createSchedule(@CurrentTenantUser() user: TenantJwtPayload, @Body() body: CreateScheduleDto) {
    return this.clinicConfigService.createSchedule(body, user.tenantId);
  }

  @Get('schedules')
  @Roles('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA')
  listSchedules(@CurrentTenantUser() user: TenantJwtPayload) {
    return this.clinicConfigService.listSchedules(user.tenantId);
  }

  @Post('form-settings')
  @Roles('MASTER', 'ADMIN')
  createFormSettings(@CurrentTenantUser() user: TenantJwtPayload, @Body() body: CreateFormSettingsDto) {
    return this.clinicConfigService.createFormSettings(body.fields, user.tenantId);
  }

  @Get('form-settings')
  @Roles('MASTER', 'ADMIN', 'DENTISTA')
  getFormSettings(@CurrentTenantUser() user: TenantJwtPayload) {
    return this.clinicConfigService.getFormSettings(user.tenantId);
  }

  @Put('schedules')
  @Roles('MASTER', 'ADMIN')
  replaceSchedules(@CurrentTenantUser() user: TenantJwtPayload, @Body() body: CreateScheduleDto[]) {
    return this.clinicConfigService.replaceSchedules(body, user.tenantId);
  }
}
