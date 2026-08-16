import { Injectable } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ITenantsRepository, TenantWithCounts } from './tenants.repository.interface';

const COUNTS_SELECT = {
  _count: { select: { users: true, patients: true, appointments: true } },
} as const;

function withCounts(tenant: Tenant & { _count: { users: number; patients: number; appointments: number } }): TenantWithCounts {
  const { _count, ...rest } = tenant;
  return {
    ...rest,
    usersCount: _count.users,
    patientsCount: _count.patients,
    appointmentsCount: _count.appointments,
  } as TenantWithCounts;
}

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

  async listWithCounts(): Promise<TenantWithCounts[]> {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: COUNTS_SELECT,
    });
    return tenants.map(withCounts);
  }

  async findByIdWithCounts(id: string): Promise<TenantWithCounts | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: COUNTS_SELECT,
    });
    return tenant ? withCounts(tenant) : null;
  }

  updateActive(id: string, isActive: boolean): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data: { isActive } });
  }
}
