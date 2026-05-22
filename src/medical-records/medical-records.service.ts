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

  create(appointmentId: string, content: Record<string, unknown>) {
    return this.medicalRecordsRepository.create({
      appointmentId,
      content: content as Prisma.InputJsonValue,
      version: 1,
    });
  }

  async duplicate(id: string) {
    const current = await this.medicalRecordsRepository.findById(id);
    if (!current) throw new NotFoundException('Prontuário não encontrado');

    return this.medicalRecordsRepository.create({
      appointmentId: current.appointmentId,
      content: current.content as Prisma.InputJsonValue,
      version: current.version + 1,
    });
  }

  async findOne(id: string) {
    const record = await this.medicalRecordsRepository.findById(id);
    if (!record) throw new NotFoundException('Prontuário não encontrado');
    return record;
  }

  async attach(id: string, file: Express.Multer.File) {
    const fileUrl = await this.s3Service.uploadFile(file.originalname, file.buffer);
    return this.medicalRecordsRepository.createAttachment({
      medicalRecordId: id,
      fileUrl,
      category: AttachmentCategory.MEDICAL_ATTACHMENT,
    });
  }
}
