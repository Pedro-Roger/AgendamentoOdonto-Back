import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { S3Service } from './shared/s3.service';
import { AttachmentCategory } from './common/enums/attachment-category.enum';
import { SubmitElectronicSignatureDto } from './signatures/dto/submit-electronic-signature.dto';
import {
  ISignatureTokensRepository,
  SIGNATURE_TOKENS_REPOSITORY,
} from './signatures/repositories/signature-tokens.repository.interface';
import {
  IMedicalRecordsRepository,
  MEDICAL_RECORDS_REPOSITORY,
} from './medical-records/repositories/medical-records.repository.interface';

const SIGNATURE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_BASE64_BYTES = 2 * 1024 * 1024;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHYSICAL_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
]);

@Injectable()
export class SignaturesService {
  constructor(
    @Inject(SIGNATURE_TOKENS_REPOSITORY)
    private readonly signatureTokensRepository: ISignatureTokensRepository,
    @Inject(MEDICAL_RECORDS_REPOSITORY)
    private readonly medicalRecordsRepository: IMedicalRecordsRepository,
    private readonly s3Service: S3Service,
  ) {}

  async uploadPhysical(medicalRecordId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (file.size > MAX_FILE_BYTES) throw new BadRequestException('Arquivo excede 5MB');
    if (!ALLOWED_PHYSICAL_MIME.has(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    const fileUrl = await this.s3Service.uploadFile(file.originalname, file.buffer);
    return this.medicalRecordsRepository.createAttachment({
      medicalRecordId,
      fileUrl,
      category: AttachmentCategory.PHYSICAL_SIGNATURE,
    });
  }

  generateElectronicLink(medicalRecordId: string) {
    const token = randomBytes(32).toString('hex');
    return this.signatureTokensRepository.create(token, medicalRecordId);
  }

  async submitElectronic(
    token: string,
    body: SubmitElectronicSignatureDto,
    ipAddress: string,
  ) {
    const signatureToken = await this.signatureTokensRepository.findByToken(token);
    if (!signatureToken) throw new NotFoundException('Token inválido');
    if (signatureToken.usedAt) throw new BadRequestException('Token já utilizado');

    const ageMs = Date.now() - new Date(signatureToken.createdAt).getTime();
    if (ageMs > SIGNATURE_TOKEN_TTL_MS) {
      throw new BadRequestException('Token expirado');
    }

    if (!body?.imageBase64 || typeof body.imageBase64 !== 'string') {
      throw new BadRequestException('Assinatura inválida');
    }
    if (body.imageBase64.length > MAX_BASE64_BYTES) {
      throw new BadRequestException('Imagem excede limite');
    }

    const consumed = await this.signatureTokensRepository.consume(token);
    if (consumed.count === 0) throw new BadRequestException('Token já utilizado');

    const signatureBuffer = Buffer.from(body.imageBase64, 'base64');
    const fileUrl = await this.s3Service.uploadFile(`${token}.png`, signatureBuffer);

    return this.medicalRecordsRepository.createAttachment({
      medicalRecordId: signatureToken.medicalRecordId,
      fileUrl,
      category: `${AttachmentCategory.ELECTRONIC_SIGNATURE}|${ipAddress}|${body.latitude ?? ''}|${body.longitude ?? ''}`,
    });
  }
}
