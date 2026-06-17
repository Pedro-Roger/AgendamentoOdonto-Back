import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IMedicalRecordsRepository,
  MEDICAL_RECORDS_REPOSITORY,
} from './repositories/medical-records.repository.interface';
import { S3Service } from '../shared/s3.service';
import { AttachmentCategory } from '../common/enums/attachment-category.enum';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @Inject(MEDICAL_RECORDS_REPOSITORY)
    private readonly medicalRecordsRepository: IMedicalRecordsRepository,
    private readonly s3Service: S3Service,
  ) {}

  async upsertByPatient(patientId: string, content: Record<string, unknown>, tenantId: string) {
    if (!(await this.medicalRecordsRepository.patientBelongsToTenant(patientId, tenantId))) {
      throw new NotFoundException('Paciente não encontrado');
    }
    const existing = await this.medicalRecordsRepository.findLatestByPatient(patientId, tenantId);
    if (existing) {
      return this.medicalRecordsRepository.update(
        existing.id,
        { content: content as Prisma.InputJsonValue },
        tenantId,
      );
    }
    return this.medicalRecordsRepository.create({
      patientId,
      content: content as Prisma.InputJsonValue,
      version: 1,
    });
  }

  async create(
    patientId: string,
    content: Record<string, unknown>,
    tenantId: string,
    appointmentId?: string,
  ) {
    if (!(await this.medicalRecordsRepository.patientBelongsToTenant(patientId, tenantId))) {
      throw new NotFoundException('Paciente não encontrado');
    }
    return this.medicalRecordsRepository.create({
      patientId,
      appointmentId,
      content: content as Prisma.InputJsonValue,
      version: 1,
    });
  }

  async duplicate(id: string, tenantId: string) {
    const current = await this.medicalRecordsRepository.findById(id, tenantId);
    if (!current) throw new NotFoundException('Prontuário não encontrado');

    return this.medicalRecordsRepository.create({
      patientId: current.patientId,
      content: current.content as Prisma.InputJsonValue,
      version: current.version + 1,
    });
  }

  async findOne(id: string, tenantId: string) {
    const record = await this.medicalRecordsRepository.findById(id, tenantId);
    if (!record) throw new NotFoundException('Prontuário não encontrado');
    return record;
  }

  findByPatient(patientId: string, tenantId: string) {
    return this.medicalRecordsRepository.findLatestByPatient(patientId, tenantId);
  }

  listAllByPatient(patientId: string, tenantId: string) {
    return this.medicalRecordsRepository.findByPatient(patientId, tenantId);
  }

  async updateById(id: string, content: Record<string, unknown>, tenantId: string) {
    const existing = await this.medicalRecordsRepository.findById(id, tenantId);
    if (!existing) throw new NotFoundException('Prontuário não encontrado');
    return this.medicalRecordsRepository.update(
      id,
      { content: content as Prisma.InputJsonValue },
      tenantId,
    );
  }

  async attach(id: string, file: Express.Multer.File, tenantId: string) {
    const record = await this.medicalRecordsRepository.findById(id, tenantId);
    if (!record) throw new NotFoundException('Prontuário não encontrado');
    const fileUrl = await this.s3Service.uploadFile(file.originalname, file.buffer);
    return this.medicalRecordsRepository.createAttachment({
      medicalRecordId: id,
      fileUrl,
      category: AttachmentCategory.MEDICAL_ATTACHMENT,
    });
  }

  async listAttachments(medicalRecordId: string, tenantId: string) {
    const record = await this.medicalRecordsRepository.findById(medicalRecordId, tenantId);
    if (!record) throw new NotFoundException('Prontuário não encontrado');
    const attachments = await this.medicalRecordsRepository.findAttachments(
      medicalRecordId,
      tenantId,
    );
    return attachments.map((a) => ({
      ...a,
      fileUrl: this.s3Service.getSignedUrl(a.fileUrl),
    }));
  }
}
