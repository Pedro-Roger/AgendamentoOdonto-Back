import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
  list(@Query() query: SearchPatientsQueryDto) {
    return this.patientsService.list(query.q);
  }

  @Get(':id/profile')
  profile(@Param('id') id: string) {
    return this.patientsService.profile(id);
  }

  @Get(':id/timeline')
  timeline(@Param('id') id: string) {
    return this.patientsService.timeline(id);
  }
}
