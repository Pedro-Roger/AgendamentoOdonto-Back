import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantsRepository } from './repositories/tenants.repository';
import { TENANTS_REPOSITORY } from './repositories/tenants.repository.interface';

@Module({
  controllers: [TenantsController],
  providers: [
    TenantsService,
    PrismaService,
    { provide: TENANTS_REPOSITORY, useClass: TenantsRepository },
  ],
  exports: [TenantsService, TENANTS_REPOSITORY],
})
export class TenantsModule {}
