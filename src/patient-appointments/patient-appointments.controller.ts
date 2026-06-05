import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { PatientAppointmentsService } from './patient-appointments.service';
import { RemindersService } from '../whatsapp/reminders.service';

@Controller('api/public')
export class PatientAppointmentsController {
  constructor(
    private readonly patientAppointmentsService: PatientAppointmentsService,
    private readonly remindersService: RemindersService,
  ) {}

  @Get('available-schedules')
  getAvailableSchedules(@Query('serviceId') serviceId: string, @Query('date') date: string) {
    return this.patientAppointmentsService.getAvailableSchedules(serviceId, date);
  }

  @Post('appointments')
  createAppointment(
    @Body()
    body: CreateAppointmentDto,
  ) {
    return this.patientAppointmentsService.createAppointment(body);
  }

  @Get('services')
  listServices() {
    return this.patientAppointmentsService.listActiveServices();
  }

  @Get('form-settings')
  getFormSettings() {
    return this.patientAppointmentsService.getFormSettings();
  }

  @Post('confirm/:token')
  async confirmAppointment(@Param('token') token: string) {
    const confirmed = await this.remindersService.confirmAppointment(token);
    return { confirmed };
  }
}
