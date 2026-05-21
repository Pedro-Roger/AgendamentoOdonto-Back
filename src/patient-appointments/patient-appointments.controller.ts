import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { PatientAppointmentsService } from './patient-appointments.service';

@Controller('api/public')
export class PatientAppointmentsController {
  constructor(private readonly patientAppointmentsService: PatientAppointmentsService) {}

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
}
