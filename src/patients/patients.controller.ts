import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtPayload } from '../common/auth/jwt-payload.type';
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
  list(@CurrentUser() user: JwtPayload, @Query() query: SearchPatientsQueryDto) {
    return this.patientsService.list(user.tenantId, query.q);
  }

  @Get(':id/profile')
  profile(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.patientsService.profile(id, user.tenantId);
  }

  @Get(':id/timeline')
  timeline(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.patientsService.timeline(id, user.tenantId);
  }
}
