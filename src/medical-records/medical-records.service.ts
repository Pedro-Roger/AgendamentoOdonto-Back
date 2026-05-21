import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../shared/s3.service';
import { AttachmentCategory } from '../common/enums/attachment-category.enum';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  create(appointmentId: string, content: Record<string, unknown>) {
    return this.prisma.medicalRecord.create({ data: { appointmentId, content: content as Prisma.InputJsonValue, version: 1 } });
  }

  async duplicate(id: string) {
    const current = await this.prisma.medicalRecord.findUnique({ where: { id } });
    return this.prisma.medicalRecord.create({
      data: {
        appointmentId: current!.appointmentId,
        content: current!.content as Prisma.InputJsonValue,
        version: current!.version + 1,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.medicalRecord.findUnique({ where: { id } });
  }

  async attach(id: string, file: Express.Multer.File) {
    const fileUrl = await this.s3Service.uploadFile(file.originalname, file.buffer);
    return this.prisma.medicalRecordAttachment.create({
      data: { medicalRecordId: id, fileUrl, category: AttachmentCategory.MEDICAL_ATTACHMENT },
    });
  }
}
