import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTenantDto } from '../tenants/dto/create-tenant.dto';
import { TenantsService } from '../tenants/tenants.service';
import {
  ITenantsRepository,
  TENANTS_REPOSITORY,
} from '../tenants/repositories/tenants.repository.interface';

/**
 * Administração cross-tenant (superadmin da Zarko). Nunca devolve dado clínico — só metadados
 * de Compania (nome, slug, status, contagens agregadas). Ver
 * docs/superpowers/specs/2026-08-16-admin-cross-tenant-design.md §4.4.
 */
@Injectable()
export class AdminTenantsService {
  constructor(
    @Inject(TENANTS_REPOSITORY) private readonly tenantsRepository: ITenantsRepository,
    private readonly tenantsService: TenantsService,
  ) {}

  listWithCounts() {
    return this.tenantsRepository.listWithCounts();
  }

  async getByIdWithCounts(id: string) {
    const tenant = await this.tenantsRepository.findByIdWithCounts(id);
    if (!tenant) {
      throw new NotFoundException('Compania não encontrada');
    }
    return tenant;
  }

  create(data: CreateTenantDto) {
    // Reaproveita a validação de nome/slug único já existente em TenantsService.
    return this.tenantsService.create(data);
  }

  async setActive(id: string, isActive: boolean) {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Compania não encontrada');
    }
    await this.tenantsRepository.updateActive(id, isActive);
    return this.getByIdWithCounts(id);
  }
}
