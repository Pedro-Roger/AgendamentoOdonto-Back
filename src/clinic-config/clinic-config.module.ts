import { Module } from '@nestjs/common';
import { ClinicConfigController } from './clinic-config.controller';
import { ClinicConfigService } from './clinic-config.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ClinicConfigController],
  providers: [ClinicConfigService, PrismaService],
})
export class ClinicConfigModule {}
