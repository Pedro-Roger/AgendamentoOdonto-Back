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

  async resolveBySlug(slug: string) {
    const tenant = await this.repo.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException('Compania não encontrada');
    }
    return tenant;
  }

  list() {
    return this.repo.list();
  }
}
