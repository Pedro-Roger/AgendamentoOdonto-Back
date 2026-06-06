import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordsService } from './medical-records.service';

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf',
]);

@Controller('api/medical-records')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MASTER', 'ADMIN', 'DENTISTA')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  create(@Body() body: CreateMedicalRecordDto) {
    return this.medicalRecordsService.upsertByPatient(body.patientId, body.content);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.medicalRecordsService.duplicate(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Get('patient/:patientId/history')
  listAllByPatient(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.listAllByPatient(patientId);
  }

  @Post('patient/:patientId/new')
  createForPatient(
    @Param('patientId') patientId: string,
    @Body() body: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.create(patientId, body.content ?? {});
  }

  @Patch(':id')
  updateRecord(@Param('id') id: string, @Body() body: UpdateMedicalRecordDto) {
    return this.medicalRecordsService.updateById(id, body.content ?? {});
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.findByPatient(patientId);
  }

  @Get(':id/attachments')
  listAttachments(@Param('id') id: string) {
    return this.medicalRecordsService.listAttachments(id);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_BYTES } }))
  attach(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }
    return this.medicalRecordsService.attach(id, file);
  }
}
