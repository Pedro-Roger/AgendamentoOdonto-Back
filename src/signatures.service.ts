import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { S3Service } from './shared/s3.service';
import { AttachmentCategory } from './common/enums/attachment-category.enum';
import { SubmitElectronicSignatureDto } from './signatures/dto/submit-electronic-signature.dto';

@Injectable()
export class SignaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async uploadPhysical(medicalRecordId: string, file: Express.Multer.File) {
    const fileUrl = await this.s3Service.uploadFile(file.originalname, file.buffer);
    return this.prisma.medicalRecordAttachment.create({
      data: { medicalRecordId, fileUrl, category: AttachmentCategory.PHYSICAL_SIGNATURE },
    });
  }

  generateElectronicLink(medicalRecordId: string) {
    const token = `sig_${Date.now()}`;
    return this.prisma.signatureToken.create({ data: { token, medicalRecordId } });
  }

  async submitElectronic(
    token: string,
    body: SubmitElectronicSignatureDto,
    ipAddress: string,
  ) {
    const signatureToken = await this.prisma.signatureToken.findUnique({ where: { token } });
    const signatureBuffer = Buffer.from(body.imageBase64, 'base64');
    const fileUrl = await this.s3Service.uploadFile(`${token}.png`, signatureBuffer);

    await this.prisma.signatureToken.update({ where: { token }, data: { usedAt: new Date() } });

    return this.prisma.medicalRecordAttachment.create({
      data: {
        medicalRecordId: signatureToken!.medicalRecordId,
        fileUrl,
        category: `${AttachmentCategory.ELECTRONIC_SIGNATURE}|${ipAddress}|${body.latitude}|${body.longitude}`,
      },
    });
  }
}
