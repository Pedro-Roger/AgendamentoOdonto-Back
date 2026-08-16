import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentTenantUser } from '../common/auth/current-user.decorator';
import { TenantJwtPayload } from '../common/auth/jwt-payload.type';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from '../patient-appointments/dto/create-appointment.dto';

function todayIso() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

@Controller('api/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@CurrentTenantUser() user: TenantJwtPayload, @Body() body: CreateAppointmentDto) {
    return this.appointmentsService.createInternal(user.tenantId, body);
  }

  @Get('availability')
  availability(
    @CurrentTenantUser() user: TenantJwtPayload,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.availability(user.tenantId, serviceId, date);
  }

  @Get()
  list(@CurrentTenantUser() user: TenantJwtPayload, @Query('date') date?: string) {
    return this.appointmentsService.listByDate(date ?? todayIso(), user.tenantId);
  }

  @Get('week')
  findByWeek(
    @CurrentTenantUser() user: TenantJwtPayload,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.appointmentsService.findByDateRange(from, to, user.tenantId);
  }
}
