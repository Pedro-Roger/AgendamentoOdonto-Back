import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module';
import { AdminTenantsController } from './admin-tenants.controller';
import { AdminTenantsService } from './admin-tenants.service';

@Module({
  imports: [TenantsModule],
  controllers: [AdminTenantsController],
  providers: [AdminTenantsService],
})
export class AdminModule {}
