import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { CurrentTenantUser } from '../common/auth/current-user.decorator';
import { TenantJwtPayload } from '../common/auth/jwt-payload.type';

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  summary(
    @CurrentTenantUser() user: TenantJwtPayload,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.dashboard.summary(user.tenantId, from, to);
  }
}
