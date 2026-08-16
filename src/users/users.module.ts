import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { USERS_REPOSITORY } from './repositories/users.repository.interface';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    { provide: USERS_REPOSITORY, useClass: UsersRepository },
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
