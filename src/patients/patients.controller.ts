import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentTenantUser } from '../common/auth/current-user.decorator';
import { TenantJwtPayload } from '../common/auth/jwt-payload.type';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { SearchPatientsQueryDto } from './dto/search-patients-query.dto';
import { PatientsService } from './patients.service';

@Controller('api/patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MASTER', 'ADMIN', 'DENTISTA', 'RECEPCIONISTA')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  list(@CurrentTenantUser() user: TenantJwtPayload, @Query() query: SearchPatientsQueryDto) {
    return this.patientsService.list(user.tenantId, query.q);
  }

  @Get(':id/profile')
  profile(@CurrentTenantUser() user: TenantJwtPayload, @Param('id') id: string) {
    return this.patientsService.profile(id, user.tenantId);
  }

  @Get(':id/timeline')
  timeline(@CurrentTenantUser() user: TenantJwtPayload, @Param('id') id: string) {
    return this.patientsService.timeline(id, user.tenantId);
  }

  @Delete(':id')
  @Roles('MASTER', 'ADMIN', 'DENTISTA')
  remove(@CurrentTenantUser() user: TenantJwtPayload, @Param('id') id: string) {
    return this.patientsService.remove(id, user.tenantId);
  }
}
