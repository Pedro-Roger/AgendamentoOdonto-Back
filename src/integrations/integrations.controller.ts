import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../common/auth/api-key.guard';
import { PatientAppointmentsService } from '../patient-appointments/patient-appointments.service';
import { CreateAppointmentDto } from '../patient-appointments/dto/create-appointment.dto';

@Controller('api/integrations')
@UseGuards(ApiKeyGuard)
export class IntegrationsController {
  constructor(private readonly appointments: PatientAppointmentsService) {}

  @Get('services')
  services(@Req() req: any) {
    return this.appointments.listActiveServices(req.tenantId);
  }

  @Get('form-settings')
  formSettings(@Req() req: any) {
    return this.appointments.getFormSettings(req.tenantId);
  }

  @Get('availability')
  availability(
    @Req() req: any,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    return this.appointments.getAvailableSchedules(req.tenantId, serviceId, date);
  }

  @Post('appointments')
  async create(@Req() req: any, @Body() body: CreateAppointmentDto) {
    const services = await this.appointments.listActiveServices(req.tenantId);
    const allowed = services.some((s: any) => s.id === body.serviceId);
    if (!allowed) {
      throw new BadRequestException('Serviço não pertence à companhia');
    }
    return this.appointments.createAppointment(
      req.tenantId,
      body,
      'INTEGRATION',
      req.apiKeyId,
    );
  }
}
