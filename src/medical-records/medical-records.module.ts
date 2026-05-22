import { Module } from '@nestjs/common';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './medical-records.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../shared/s3.service';
import { MedicalRecordsRepository } from './repositories/medical-records.repository';
import { MEDICAL_RECORDS_REPOSITORY } from './repositories/medical-records.repository.interface';

@Module({
  controllers: [MedicalRecordsController],
  providers: [
    MedicalRecordsService,
    PrismaService,
    S3Service,
    { provide: MEDICAL_RECORDS_REPOSITORY, useClass: MedicalRecordsRepository },
  ],
  exports: [MEDICAL_RECORDS_REPOSITORY],
})
export class MedicalRecordsModule {}
