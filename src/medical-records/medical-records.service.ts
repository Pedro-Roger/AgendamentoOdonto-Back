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

  async upsertByPatient(patientId: string, content: Record<string, unknown>) {
    const existing = await this.medicalRecordsRepository.findLatestByPatient(patientId);
    if (existing) {
      return this.medicalRecordsRepository.update(existing.id, {
        content: content as Prisma.InputJsonValue,
      });
    }
    return this.medicalRecordsRepository.create({
      patientId,
      content: content as Prisma.InputJsonValue,
      version: 1,
    });
  }

  create(patientId: string, content: Record<string, unknown>, appointmentId?: string) {
    return this.medicalRecordsRepository.create({
      patientId,
      appointmentId,
      content: content as Prisma.InputJsonValue,
      version: 1,
    });
  }

  async duplicate(id: string) {
    const current = await this.medicalRecordsRepository.findById(id);
    if (!current) throw new NotFoundException('Prontuário não encontrado');

    return this.medicalRecordsRepository.create({
      patientId: current.patientId,
      content: current.content as Prisma.InputJsonValue,
      version: current.version + 1,
    });
  }

  async findOne(id: string) {
    const record = await this.medicalRecordsRepository.findById(id);
    if (!record) throw new NotFoundException('Prontuário não encontrado');
    return record;
  }

  findByPatient(patientId: string) {
    return this.medicalRecordsRepository.findLatestByPatient(patientId);
  }

  listAllByPatient(patientId: string, tenantId: string) {
    return this.medicalRecordsRepository.findByPatient(patientId, tenantId);
  }

  async updateById(id: string, content: Record<string, unknown>) {
    const existing = await this.medicalRecordsRepository.findById(id);
    if (!existing) throw new NotFoundException('Prontuário não encontrado');
    return this.medicalRecordsRepository.update(id, {
      content: content as Prisma.InputJsonValue,
    });
  }

  async attach(id: string, file: Express.Multer.File) {
    const fileUrl = await this.s3Service.uploadFile(file.originalname, file.buffer);
    return this.medicalRecordsRepository.createAttachment({
      medicalRecordId: id,
      fileUrl,
      category: AttachmentCategory.MEDICAL_ATTACHMENT,
    });
  }

  async listAttachments(medicalRecordId: string) {
    const record = await this.medicalRecordsRepository.findById(medicalRecordId);
    if (!record) throw new NotFoundException('Prontuário não encontrado');
    const attachments = await this.medicalRecordsRepository.findAttachments(medicalRecordId);
    return attachments.map((a) => ({
      ...a,
      fileUrl: this.s3Service.getSignedUrl(a.fileUrl),
    }));
  }
}
