import { Body, Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { MedicalRecordsService } from './medical-records.service';

@Controller('api/medical-records')
@UseGuards(JwtAuthGuard)
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  create(@Body() body: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(body.appointmentId, body.content);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.medicalRecordsService.duplicate(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  attach(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.medicalRecordsService.attach(id, file);
  }
}
