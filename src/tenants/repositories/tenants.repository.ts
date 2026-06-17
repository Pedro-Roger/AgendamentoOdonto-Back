import { Injectable } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ITenantsRepository } from './tenants.repository.interface';

@Injectable()
export class TenantsRepository implements ITenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  create(data: { name: string; slug: string }): Promise<Tenant> {
    return this.prisma.tenant.create({ data });
  }

  list(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
