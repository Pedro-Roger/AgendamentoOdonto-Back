import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysRepository } from './repositories/api-keys.repository';
import { API_KEYS_REPOSITORY } from './repositories/api-keys.repository.interface';

@Module({
  controllers: [ApiKeysController],
  providers: [
    PrismaService,
    ApiKeysService,
    { provide: API_KEYS_REPOSITORY, useClass: ApiKeysRepository },
  ],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
