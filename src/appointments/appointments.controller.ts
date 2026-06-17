import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtPayload } from '../common/auth/jwt-payload.type';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { AppointmentsService } from './appointments.service';

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

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query('date') date?: string) {
    return this.appointmentsService.listByDate(date ?? todayIso(), user.tenantId);
  }

  @Get('week')
  findByWeek(
    @CurrentUser() user: JwtPayload,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.appointmentsService.findByDateRange(from, to, user.tenantId);
  }
}
