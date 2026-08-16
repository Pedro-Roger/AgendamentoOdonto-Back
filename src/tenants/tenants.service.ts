import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import {
  ITenantsRepository,
  TENANTS_REPOSITORY,
} from './repositories/tenants.repository.interface';

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class TenantsService {
  constructor(
    @Inject(TENANTS_REPOSITORY) private readonly repo: ITenantsRepository,
  ) {}

  async create(data: CreateTenantDto) {
    if (!data.name?.trim()) {
      throw new BadRequestException('Nome é obrigatório');
    }
    const slug = slugify(data.slug || data.name);
    if (!slug) {
      throw new BadRequestException('Slug inválido');
    }
    const existing = await this.repo.findBySlug(slug);
    if (existing) {
      throw new ConflictException('Slug já cadastrado');
    }
    return this.repo.create({ name: data.name.trim(), slug });
  }

  /**
   * Cria a Compania própria de um dentista. Diferente de `create`, não recebe slug do cliente
   * e não falha em colisão: dois dentistas homônimos viram `dra-herlania` e `dra-herlania-2`.
   */
  async createForDentist(name: string) {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new BadRequestException('Nome é obrigatório');
    }
    const base = slugify(trimmed);
    if (!base) {
      throw new BadRequestException('Slug inválido');
    }
    let slug = base;
    let suffix = 2;
    while (await this.repo.findBySlug(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return this.repo.create({ name: trimmed, slug });
  }

  /**
   * Usado pelo booking público (`GET/POST /api/public/:slug/...`). Compania desativada é
   * tratada como inexistente (404) — sem isso, `Tenant.isActive` continuaria sendo cosmético.
   */
  async resolveBySlug(slug: string) {
    const tenant = await this.repo.findBySlug(slug);
    if (!tenant || tenant.isActive === false) {
      throw new NotFoundException('Compania não encontrada');
    }
    return tenant;
  }

  findById(id: string) {
    return this.repo.findById(id);
  }

  list() {
    return this.repo.list();
  }
}
