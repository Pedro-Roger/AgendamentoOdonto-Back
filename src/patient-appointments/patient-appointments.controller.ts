import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { PatientAppointmentsService } from './patient-appointments.service';
import { TenantsService } from '../tenants/tenants.service';

@Controller('api/public/:slug')
export class PatientAppointmentsController {
  constructor(
    private readonly patientAppointmentsService: PatientAppointmentsService,
    private readonly tenants: TenantsService,
  ) {}

  @Get('services')
  async listServices(@Param('slug') slug: string) {
    const tenant = await this.tenants.resolveBySlug(slug);
    return this.patientAppointmentsService.listActiveServices(tenant.id);
  }

  @Get('form-settings')
  async getFormSettings(@Param('slug') slug: string) {
    const tenant = await this.tenants.resolveBySlug(slug);
    return this.patientAppointmentsService.getFormSettings(tenant.id);
  }

  @Get('available-schedules')
  async getAvailableSchedules(
    @Param('slug') slug: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    const tenant = await this.tenants.resolveBySlug(slug);
    return this.patientAppointmentsService.getAvailableSchedules(tenant.id, serviceId, date);
  }

  @Post('appointments')
  async create(@Param('slug') slug: string, @Body() body: CreateAppointmentDto) {
    const tenant = await this.tenants.resolveBySlug(slug);
    return this.patientAppointmentsService.createAppointment(tenant.id, body, 'PUBLIC');
  }
}
