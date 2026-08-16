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
import { CurrentTenantUser } from '../common/auth/current-user.decorator';
import { TenantJwtPayload } from '../common/auth/jwt-payload.type';
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
  create(@CurrentTenantUser() user: TenantJwtPayload, @Body() body: CreateMedicalRecordDto) {
    return this.medicalRecordsService.upsertByPatient(body.patientId, body.content, user.tenantId);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentTenantUser() user: TenantJwtPayload, @Param('id') id: string) {
    return this.medicalRecordsService.duplicate(id, user.tenantId);
  }

  @Get(':id')
  findOne(@CurrentTenantUser() user: TenantJwtPayload, @Param('id') id: string) {
    return this.medicalRecordsService.findOne(id, user.tenantId);
  }

  @Get('patient/:patientId/history')
  listAllByPatient(
    @CurrentTenantUser() user: TenantJwtPayload,
    @Param('patientId') patientId: string,
  ) {
    return this.medicalRecordsService.listAllByPatient(patientId, user.tenantId);
  }

  @Post('patient/:patientId/new')
  createForPatient(
    @CurrentTenantUser() user: TenantJwtPayload,
    @Param('patientId') patientId: string,
    @Body() body: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.create(patientId, body.content ?? {}, user.tenantId);
  }

  @Patch(':id')
  updateRecord(
    @CurrentTenantUser() user: TenantJwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.updateById(id, body.content ?? {}, user.tenantId);
  }

  @Get('patient/:patientId')
  findByPatient(@CurrentTenantUser() user: TenantJwtPayload, @Param('patientId') patientId: string) {
    return this.medicalRecordsService.findByPatient(patientId, user.tenantId);
  }

  @Get(':id/attachments')
  listAttachments(@CurrentTenantUser() user: TenantJwtPayload, @Param('id') id: string) {
    return this.medicalRecordsService.listAttachments(id, user.tenantId);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_BYTES } }))
  attach(
    @CurrentTenantUser() user: TenantJwtPayload,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }
    return this.medicalRecordsService.attach(id, file, user.tenantId);
  }
}
