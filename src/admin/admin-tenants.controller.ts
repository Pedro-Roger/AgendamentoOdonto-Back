import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { CreateTenantDto } from '../tenants/dto/create-tenant.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { AdminTenantsService } from './admin-tenants.service';

/**
 * Administração cross-tenant — só a Zarko (SUPERADMIN) acessa. Nunca expõe Patient/Appointment/
 * MedicalRecord: só metadados de Compania + contagens agregadas (spec §4.4).
 */
@Controller('api/admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class AdminTenantsController {
  constructor(private readonly adminTenantsService: AdminTenantsService) {}

  @Get()
  list() {
    return this.adminTenantsService.listWithCounts();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.adminTenantsService.getByIdWithCounts(id);
  }

  @Post()
  create(@Body() body: CreateTenantDto) {
    return this.adminTenantsService.create(body);
  }

  @Patch(':id')
  setActive(@Param('id') id: string, @Body() body: UpdateTenantStatusDto) {
    return this.adminTenantsService.setActive(id, body.isActive);
  }
}
