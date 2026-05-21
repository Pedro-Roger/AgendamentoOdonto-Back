import { Module } from '@nestjs/common';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';
import { PrismaService } from './prisma/prisma.service';
import { S3Service } from './shared/s3.service';

@Module({
  controllers: [SignaturesController],
  providers: [SignaturesService, PrismaService, S3Service],
})
export class SignaturesModule {}
