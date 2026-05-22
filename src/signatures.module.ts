import { Module } from '@nestjs/common';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';
import { PrismaService } from './prisma/prisma.service';
import { S3Service } from './shared/s3.service';
import { SignatureTokensRepository } from './signatures/repositories/signature-tokens.repository';
import { SIGNATURE_TOKENS_REPOSITORY } from './signatures/repositories/signature-tokens.repository.interface';
import { MedicalRecordsRepository } from './medical-records/repositories/medical-records.repository';
import { MEDICAL_RECORDS_REPOSITORY } from './medical-records/repositories/medical-records.repository.interface';

@Module({
  controllers: [SignaturesController],
  providers: [
    SignaturesService,
    PrismaService,
    S3Service,
    { provide: SIGNATURE_TOKENS_REPOSITORY, useClass: SignatureTokensRepository },
    { provide: MEDICAL_RECORDS_REPOSITORY, useClass: MedicalRecordsRepository },
  ],
})
export class SignaturesModule {}
